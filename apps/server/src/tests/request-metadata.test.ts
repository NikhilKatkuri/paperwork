/**
 * Request-metadata tests.
 *
 * Two halves:
 *
 * - unit coverage for the parsers in `@/utils/metadata` and `@/utils/requestMeta`
 *   (bounds, allowlisting, label building, spoof handling), and
 * - integration coverage against a throwaway Express app that proves the
 *   `trust proxy` policy actually governs which address is attributed to a
 *   client, plus that submission metadata is derived from the request rather
 *   than from the client's body.
 *
 * The dedicated database name is overridden before any app module is imported
 * for the same reason as `submission-flow.test.ts`: `dotenv` never overwrites
 * an existing variable. No connection is opened here — every path exercised is
 * synchronous or header-only.
 */
process.env.MONGO_URI =
    process.env.TEST_MONGO_URI ??
    'mongodb://localhost:27017/paperwork_metadata_test';

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Request } from 'express';

type MetadataModule = typeof import('@/utils/metadata');
type RequestMetaModule = typeof import('@/utils/requestMeta');

let metadataUtils: MetadataModule;
let requestMetaUtils: RequestMetaModule;
let userAgentService: typeof import('@/modules/auth/service/userAgent.service').default;

const CHROME_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

/** Minimal Express-Request double for the pure parser helpers. */
const fakeRequest = (
    headers: Record<string, string | string[] | undefined> = {},
    overrides: Record<string, unknown> = {}
) =>
    ({
        headers: { ...headers },
        ip: '203.0.113.7',
        socket: { remoteAddress: '203.0.113.7' },
        app: { get: () => 1 },
        secure: false,
        ...overrides,
    }) as unknown as Request;

before(async () => {
    metadataUtils = await import('@/utils/metadata');
    requestMetaUtils = await import('@/utils/requestMeta');
    userAgentService = (
        await import('@/modules/auth/service/userAgent.service')
    ).default;
});

describe('normalizeIp', () => {
    it('strips IPv4-mapped IPv6 prefixes', () => {
        assert.equal(
            requestMetaUtils.normalizeIp('::ffff:127.0.0.1'),
            '127.0.0.1'
        );
    });

    it('unwraps bracketed loopback literals', () => {
        assert.equal(requestMetaUtils.normalizeIp('[::1]'), '127.0.0.1');
        assert.equal(requestMetaUtils.normalizeIp('::1'), '127.0.0.1');
    });

    it('trims whitespace and returns undefined for blanks', () => {
        assert.equal(
            requestMetaUtils.normalizeIp('  203.0.113.7  '),
            '203.0.113.7'
        );
        assert.equal(requestMetaUtils.normalizeIp('   '), undefined);
        assert.equal(requestMetaUtils.normalizeIp(null), undefined);
    });
});

describe('sanitizeMetadataValue', () => {
    it('strips control characters and collapses whitespace', () => {
        assert.equal(
            metadataUtils.sanitizeMetadataValue(
                'Chrome\u0000  \u001b[31m 126',
                80
            ),
            'Chrome [31m 126'
        );
    });

    it('enforces the maximum length', () => {
        const long = 'a'.repeat(200);
        assert.equal(metadataUtils.sanitizeMetadataValue(long, 40)?.length, 40);
    });

    it('rejects non-string and empty values', () => {
        assert.equal(metadataUtils.sanitizeMetadataValue(42, 80), undefined);
        assert.equal(metadataUtils.sanitizeMetadataValue('   ', 80), undefined);
    });
});

describe('parseUserAgent', () => {
    it('parses a desktop Chrome UA', () => {
        const parsed = metadataUtils.parseUserAgent(CHROME_UA);
        assert.equal(parsed.browser?.family, 'Chrome');
        assert.equal(parsed.os?.family, 'Windows');
        assert.equal(parsed.raw, CHROME_UA);
    });

    it('parses an Android mobile UA including device hints', () => {
        const parsed = metadataUtils.parseUserAgent(ANDROID_UA);
        assert.equal(parsed.device?.type, 'mobile');
        assert.equal(parsed.device?.brand, 'Google');
        assert.equal(parsed.device?.model, 'Pixel 8');
        assert.equal(parsed.os?.family, 'Android');
    });

    it('returns an empty result for a missing header', () => {
        const parsed = metadataUtils.parseUserAgent(undefined);
        assert.equal(parsed.raw, null);
        assert.equal(parsed.browser, null);
        assert.equal(parsed.os, null);
        assert.equal(parsed.device, null);
    });
});

describe('parseClientMetadata', () => {
    it('accepts a valid payload', () => {
        const req = fakeRequest({
            'x-paperwork-client-meta': JSON.stringify({
                browser: { family: 'Firefox', version: '128' },
                platform: 'Windows',
                mobile: false,
            }),
        });

        const parsed = metadataUtils.parseClientMetadata(req);
        assert.equal(parsed?.browser?.family, 'Firefox');
        assert.equal(parsed?.platform, 'Windows');
        assert.equal(parsed?.mobile, false);
    });

    it('drops unknown properties instead of passing them through', () => {
        const req = fakeRequest({
            'x-paperwork-client-meta': JSON.stringify({
                browser: { family: 'Chrome' },
                password: 'hunter2',
                token: 'smuggled',
            }),
        });

        const parsed = metadataUtils.parseClientMetadata(req) as Record<
            string,
            unknown
        >;
        assert.equal(parsed.browser !== undefined, true);
        assert.equal('password' in parsed, false);
        assert.equal('token' in parsed, false);
    });

    it('ignores malformed JSON, arrays and oversized payloads', () => {
        assert.equal(
            metadataUtils.parseClientMetadata(
                fakeRequest({ 'x-paperwork-client-meta': '{not json' })
            ),
            null
        );
        assert.equal(
            metadataUtils.parseClientMetadata(
                fakeRequest({
                    'x-paperwork-client-meta': ['a', 'b'],
                })
            ),
            null
        );
        assert.equal(
            metadataUtils.parseClientMetadata(
                fakeRequest({
                    'x-paperwork-client-meta': 'x'.repeat(4096),
                })
            ),
            null
        );
    });

    it('rejects values carrying control characters', () => {
        const req = fakeRequest({
            'x-paperwork-client-meta': JSON.stringify({
                browser: { family: 'Bad\u0007Browser' },
            }),
        });
        assert.equal(metadataUtils.parseClientMetadata(req), null);
    });
});

describe('geo lookup', () => {
    it('classifies private and loopback ranges', () => {
        for (const ip of [
            '10.1.2.3',
            '172.16.0.1',
            '172.31.255.255',
            '192.168.1.1',
            '127.0.0.1',
            '169.254.1.1',
            '::1',
            'fd00::1',
        ]) {
            assert.equal(metadataUtils.isPrivateIp(ip), true, ip);
        }

        assert.equal(metadataUtils.isPrivateIp('8.8.8.8'), false);
        assert.equal(metadataUtils.isPrivateIp('203.0.113.7'), false);
    });

    it('never returns a location for private addresses', () => {
        assert.equal(metadataUtils.lookupGeo('127.0.0.1'), null);
        assert.equal(metadataUtils.lookupGeo('10.0.0.5'), null);
        assert.equal(metadataUtils.lookupGeo(null), null);
    });
});

describe('label building', () => {
    it('prefers the server-parsed identity over client hints', () => {
        const meta = {
            client: {
                browser: { family: 'TotallyRealBrowser', version: '1' },
                platform: 'FakeOS',
            },
            server: {
                ip: '203.0.113.7',
                userAgent: CHROME_UA,
                browser: { family: 'Chrome', version: '126.0.0.0' },
                os: { family: 'Windows', version: '10' },
                device: null,
                receivedAt: new Date().toISOString(),
                forwardedFor: null,
                proxyTrusted: true,
                secure: false,
                location: null,
            },
        };

        const label = metadataUtils.buildDeviceLabel(meta);
        assert.match(label, /Chrome/);
        assert.match(label, /Windows/);
        assert.doesNotMatch(label, /TotallyRealBrowser/);
    });

    it('falls back to client hints when the server cannot parse the UA', () => {
        const meta = {
            client: {
                browser: { family: 'Firefox' },
                os: { family: 'Linux' },
            },
            server: {
                ip: null,
                userAgent: null,
                browser: null,
                os: null,
                device: null,
                receivedAt: new Date().toISOString(),
                forwardedFor: null,
                proxyTrusted: false,
                secure: undefined,
                location: null,
            },
        };

        const label = metadataUtils.buildDeviceLabel(meta);
        assert.match(label, /Firefox/);
        assert.match(label, /Linux/);
    });

    it('builds location labels without repeating the region and without an IP', () => {
        assert.equal(
            metadataUtils.buildLocationLabel({
                city: 'Singapore',
                region: 'Singapore',
                country: 'SG',
            }),
            'Singapore, SG'
        );

        const unknown = metadataUtils.buildLocationLabel(null);
        assert.equal(unknown, 'Unknown location');
        assert.doesNotMatch(unknown, /\d+\.\d+/);
    });
});

describe('trust proxy integration', () => {
    let expressModule: typeof import('express').default;

    const probes: Server[] = [];

    before(async () => {
        expressModule = (await import('express')).default;
    });

    after(() => {
        for (const server of probes) server.close();
    });

    const startProbe = async (trustProxy: boolean | number) => {
        const app = expressModule();
        app.set('trust proxy', trustProxy);

        app.get('/probe', (req, res) => {
            res.json({
                network: requestMetaUtils.captureNetworkInfo(req),
                meta: userAgentService.getMeta(req),
                labels: userAgentService.getSecurityLabels(req),
            });
        });

        const server = app.listen(0);
        await new Promise<void>((resolve) => server.once('listening', resolve));
        probes.push(server);

        const { port } = server.address() as AddressInfo;
        return `http://127.0.0.1:${port}/probe`;
    };

    it('trusts exactly one hop: the rightmost untrusted entry wins', async () => {
        const url = await startProbe(1);
        const response = await fetch(url, {
            headers: {
                'x-forwarded-for': '9.9.9.9, 203.0.113.7',
                'user-agent': CHROME_UA,
            },
        });

        const body = (await response.json()) as any;
        assert.equal(
            body.network.ip,
            '203.0.113.7',
            'a forged leftmost entry must not become req.ip'
        );
        assert.equal(body.network.forwardedFor, '9.9.9.9, 203.0.113.7');
        assert.equal(body.meta.server.proxyTrusted, true);
    });

    it('ignores forwarding headers entirely when trust proxy is false', async () => {
        const url = await startProbe(false);
        const response = await fetch(url, {
            headers: { 'x-forwarded-for': '203.0.113.7' },
        });

        const body = (await response.json()) as any;
        assert.equal(body.network.ip, '127.0.0.1');
        assert.equal(body.meta.server.proxyTrusted, false);
        assert.equal(body.network.forwardedFor, '203.0.113.7');
    });

    it('validates and forwards client metadata, and masks the IP in labels', async () => {
        const url = await startProbe(1);
        const response = await fetch(url, {
            headers: {
                'x-forwarded-for': '203.0.113.7',
                'user-agent': CHROME_UA,
                'x-paperwork-client-meta': JSON.stringify({
                    platform: 'Windows',
                    mobile: false,
                    garbage: 'dropped',
                }),
            },
        });

        const body = (await response.json()) as any;
        assert.equal(body.meta.client.platform, 'Windows');
        assert.equal('garbage' in body.meta.client, false);
        assert.match(body.labels.device, /Chrome/);
        assert.equal(body.labels.ip, '203.0.*.*');
        assert.equal(typeof body.labels.location, 'string');
        assert.ok(body.labels.location.length > 0);
    });
});

describe('submission metadata is server-derived', () => {
    it('ignores body.metadata and uses the request instead', async () => {
        const FillController = (
            await import('@/modules/forms/controllers/controller.fill')
        ).default;
        const controller = new FillController();

        const req = fakeRequest(
            { 'user-agent': CHROME_UA },
            {
                body: {
                    answers: [],
                    metadata: {
                        ipAddress: '6.6.6.6',
                        userAgent: 'Forged/1.0',
                    },
                },
                params: { formId: 'form-1' },
                query: {},
                user: { id: 'user-1', email: 'owner@example.com' },
            }
        );

        const content = (
            controller as unknown as {
                getContent(req: Request): { metadata: Record<string, unknown> };
            }
        ).getContent(req);

        assert.notEqual(content.metadata.ipAddress, '6.6.6.6');
        assert.notEqual(content.metadata.userAgent, 'Forged/1.0');
        assert.match(String(content.metadata.userAgent), /Chrome/);
        assert.match(String(content.metadata.browser), /Chrome/);
        assert.match(String(content.metadata.os), /Windows/);
    });

    it('accepts a client body without metadata and strips forged metadata', async () => {
        const { postFormSchema } =
            await import('@/modules/forms/validators/validator.fill');

        const body = {
            idempotencyKey: 'key-1',
            answers: [
                {
                    questionId: '507f1f77bcf86cd799439011',
                    value: ['yes'],
                },
            ],
        };

        const parsed = postFormSchema.parse({
            params: { formId: '507f1f77bcf86cd799439011' },
            body,
        });

        assert.equal(
            'metadata' in parsed.body,
            false,
            'the web client does not send metadata and must not be rejected'
        );

        const forged = postFormSchema.parse({
            params: { formId: '507f1f77bcf86cd799439011' },
            body: { ...body, metadata: { ipAddress: '6.6.6.6' } },
        });

        assert.equal(
            'metadata' in forged.body,
            false,
            'client-supplied metadata must be stripped before the controller'
        );
    });
});
