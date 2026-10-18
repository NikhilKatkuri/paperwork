import type { Request } from 'express';

import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

import {
    CLIENT_METADATA_HEADER,
    CLIENT_METADATA_MAX_BYTES,
    METADATA_LIMITS,
    type ClientMetadata,
    type GeoLocation,
    type RequestMetadata,
} from '@paperwork/types';

/**
 * Central helpers for the request metadata contract.
 *
 * Every value that reaches this module is untrusted input — client hints are
 * attacker-controlled by definition, and the User-Agent header is only
 * slightly harder to forge. Each parser therefore:
 *
 * - bounds the input size before doing any work,
 * - allowlists fields and drops unknown properties,
 * - rejects control characters (log-injection defence),
 * - enforces maximum lengths, and
 * - returns `null`/`undefined` instead of fabricating placeholders.
 */

/** Control characters that must never survive into a label or stored value. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]+/g;

/** Conservative allowlist for metadata values: printable ASCII, bounded. */
const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

/**
 * Strips control characters, collapses whitespace and enforces `max`.
 * Returns `undefined` rather than an empty or fabricated value.
 */
export const sanitizeMetadataValue = (
    value: unknown,
    max: number
): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const cleaned = value
        .replace(CONTROL_CHARS, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return undefined;
    return cleaned.slice(0, max);
};

const boundedString = (max: number) =>
    z.string().min(1).max(max).regex(PRINTABLE_ASCII);

const clientBrowserSchema = z.object({
    family: boundedString(METADATA_LIMITS.name).optional(),
    version: boundedString(METADATA_LIMITS.version).optional(),
});

const clientDeviceSchema = z.object({
    type: boundedString(METADATA_LIMITS.name).optional(),
    brand: boundedString(METADATA_LIMITS.name).optional(),
    model: boundedString(METADATA_LIMITS.name).optional(),
});

/**
 * `z.object` strips unknown keys, which is exactly the policy here: a client
 * trying to smuggle extra properties (including secrets such as `password` or
 * `token`) through the metadata header has them dropped before anything else
 * sees the payload.
 */
const clientMetadataSchema = z.object({
    browser: clientBrowserSchema.optional(),
    os: clientBrowserSchema.optional(),
    device: clientDeviceSchema.optional(),
    platform: boundedString(METADATA_LIMITS.name).optional(),
    mobile: z.boolean().optional(),
});

/**
 * Parses the `X-Paperwork-Client-Meta` header.
 *
 * Returns `null` — never throws — when the header is absent, oversized,
 * not a single string, not valid JSON, fails the schema, or carries no
 * recognised field at all. Sign-in and other flows fall back to
 * server-derived metadata in that case.
 */
export const parseClientMetadata = (req: Request): ClientMetadata | null => {
    try {
        const header = req.headers[CLIENT_METADATA_HEADER.toLowerCase()];

        if (typeof header !== 'string' || header.length === 0) return null;
        if (Buffer.byteLength(header, 'utf8') > CLIENT_METADATA_MAX_BYTES) {
            return null;
        }

        const parsed = clientMetadataSchema.safeParse(JSON.parse(header));
        if (!parsed.success) return null;

        const value = parsed.data;
        const hasAnyField =
            value.browser !== undefined ||
            value.os !== undefined ||
            value.device !== undefined ||
            value.platform !== undefined ||
            value.mobile !== undefined;

        return hasAnyField ? value : null;
    } catch {
        return null;
    }
};

export interface ParsedUserAgent {
    /** Bounded copy of the header exactly as received. */
    raw: string | null;
    browser: { family?: string; version?: string } | null;
    os: { family?: string; version?: string } | null;
    device: { type?: string; brand?: string; model?: string } | null;
}

const EMPTY_USER_AGENT: ParsedUserAgent = {
    raw: null,
    browser: null,
    os: null,
    device: null,
};

/**
 * Parses the User-Agent header received by the server.
 *
 * The header itself is always preserved (bounded) even when parsing fails, so
 * a stored record never loses the only device signal there is.
 */
export const parseUserAgent = (rawHeader: unknown): ParsedUserAgent => {
    const raw = sanitizeMetadataValue(rawHeader, METADATA_LIMITS.userAgentRaw);
    if (!raw) return EMPTY_USER_AGENT;

    try {
        const result = new UAParser(raw).getResult();

        const browser = {
            family: sanitizeMetadataValue(
                result.browser.name,
                METADATA_LIMITS.name
            ),
            version: sanitizeMetadataValue(
                result.browser.version,
                METADATA_LIMITS.version
            ),
        };
        const os = {
            family: sanitizeMetadataValue(result.os.name, METADATA_LIMITS.name),
            version: sanitizeMetadataValue(
                result.os.version,
                METADATA_LIMITS.version
            ),
        };
        const device = {
            type: sanitizeMetadataValue(
                result.device.type,
                METADATA_LIMITS.name
            ),
            brand: sanitizeMetadataValue(
                result.device.vendor,
                METADATA_LIMITS.name
            ),
            model: sanitizeMetadataValue(
                result.device.model,
                METADATA_LIMITS.name
            ),
        };

        return {
            raw,
            browser: browser.family || browser.version ? browser : null,
            os: os.family || os.version ? os : null,
            device: device.type || device.brand || device.model ? device : null,
        };
    } catch {
        return { raw, browser: null, os: null, device: null };
    }
};

/**
 * True for loopback, link-local and RFC 1918 / RFC 4193 private addresses.
 * These are never worth a GeoIP lookup and must never be presented as a
 * meaningful location.
 */
export const isPrivateIp = (ip: string): boolean => {
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
    if (v4) {
        const a = Number(v4[1]);
        const b = Number(v4[2]);
        if (a === 0 || a === 127 || a === 10) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 169 && b === 254) return true;
        return false;
    }

    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
    if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 link-local
    return false;
};

/**
 * Looks up an IP in the deployment's local GeoIP database (`geoip-lite`).
 *
 * No external service is involved and there is no API key to configure —
 * the database ships with the dependency. Results are city-level estimates
 * from network registration data, never a precise physical location, and are
 * only used when the address is public.
 */
export const lookupGeo = (ip: string | null): GeoLocation | null => {
    if (!ip || isPrivateIp(ip)) return null;

    try {
        const geo = geoip.lookup(ip);
        if (!geo) return null;

        const location: GeoLocation = {
            city: sanitizeMetadataValue(geo.city, METADATA_LIMITS.name),
            region: sanitizeMetadataValue(geo.region, METADATA_LIMITS.name),
            country: sanitizeMetadataValue(geo.country, METADATA_LIMITS.name),
            timezone: sanitizeMetadataValue(
                (geo as { timezone?: string }).timezone,
                METADATA_LIMITS.name
            ),
        };

        const hasAny = Object.values(location).some(Boolean);
        return hasAny ? location : null;
    } catch {
        return null;
    }
};

/**
 * Builds the human-readable device label used in sign-in alert emails.
 *
 * Precedence is deliberate: values parsed from the User-Agent header the
 * server actually received win, and client-provided hints only fill gaps the
 * header does not cover (for example the platform string or an Android model
 * the UA string omits). The result is always bounded and control characters
 * cannot survive into the email.
 */
export const buildDeviceLabel = (meta: RequestMetadata): string => {
    const { client, server } = meta;

    const brand = server.device?.brand ?? client?.device?.brand;
    const model = server.device?.model ?? client?.device?.model;
    const deviceType =
        server.device?.type ??
        (client?.mobile ? 'mobile' : client?.device?.type);

    const browserFamily = server.browser?.family ?? client?.browser?.family;
    const browserVersion = server.browser?.version ?? client?.browser?.version;
    const osFamily = server.os?.family ?? client?.os?.family;
    const osVersion = server.os?.version ?? client?.os?.version;

    const parts: string[] = [];

    const deviceName = [brand, model].filter(Boolean).join(' ');
    if (deviceName) {
        parts.push(
            deviceType && deviceType !== 'mobile'
                ? `${deviceName} (${deviceType})`
                : deviceName
        );
    }

    if (browserFamily) {
        parts.push([browserFamily, browserVersion].filter(Boolean).join(' '));
    }

    if (osFamily) {
        parts.push([osFamily, osVersion].filter(Boolean).join(' '));
    } else if (client?.platform) {
        parts.push(client.platform);
    }

    return (
        sanitizeMetadataValue(parts.join(' · '), METADATA_LIMITS.label) ??
        'Unknown device'
    );
};

/**
 * Builds the location label used in sign-in alert emails.
 *
 * Only GeoIP-derived fields are used. An IP address is not a location, so
 * when no lookup result exists the label says so instead of echoing one.
 */
export const buildLocationLabel = (location: GeoLocation | null): string => {
    if (!location) return 'Unknown location';

    const parts = [location.city, location.region, location.country]
        .filter((part): part is string => Boolean(part))
        // "Singapore, Singapore" reads as an error; drop consecutive repeats.
        .filter((part, index, all) => part !== all[index - 1]);

    if (parts.length === 0) return 'Unknown location';

    return (
        sanitizeMetadataValue(parts.join(', '), METADATA_LIMITS.label) ??
        'Unknown location'
    );
};
