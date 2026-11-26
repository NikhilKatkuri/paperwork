import AutoBoundClass from '@/utils/AutoBoundClass';

import OtpChallengeModel from '../schemas/otpChallenge.model';
import OTPBoot from './otp.service';

export type OtpPurpose = '2fa' | 'email-verify';

/** Per-account attempt ceiling, independent of the client IP. */
const MAX_ATTEMPTS = 5;

/**
 * Server-side state for one-time passwords.
 *
 * The OTP value itself is still derived by `otp.service`, but the challenge is
 * now bound to a purpose and a specific user, consumed atomically on success,
 * and limited to a small number of attempts. A code can no longer be replayed
 * in a later authentication ceremony, and brute force is throttled per account
 * rather than only per IP.
 */
class OtpChallengeService extends AutoBoundClass {
    private keyFor(userId: string, purpose: OtpPurpose): string {
        return `${purpose}:${userId}`;
    }

    async issue(
        userId: string,
        email: string,
        purpose: OtpPurpose
    ): Promise<{ otp: string; expiresAt: number }> {
        const { otp, expiresAt } = OTPBoot.generateOTP({ userId, email });

        await OtpChallengeModel.findOneAndUpdate(
            { key: this.keyFor(userId, purpose) },
            {
                $set: {
                    expiresAt: new Date(expiresAt),
                    attempts: 0,
                    consumed: false,
                },
            },
            {
                upsert: true,
                returnDocument: 'after',
                setDefaultsOnInsert: true,
            }
        );

        return { otp, expiresAt };
    }

    async verify(
        userId: string,
        email: string,
        otp: string,
        purpose: OtpPurpose
    ): Promise<boolean> {
        const key = this.keyFor(userId, purpose);

        const challenge = await OtpChallengeModel.findOneAndUpdate(
            {
                key,
                consumed: false,
                expiresAt: { $gt: new Date() },
                attempts: { $lt: MAX_ATTEMPTS },
            },
            { $inc: { attempts: 1 } },
            { returnDocument: 'after' }
        ).lean();

        if (!challenge) return false;

        // Recomputing from the stored expiry binds the code to this user,
        // this email and this challenge window; `verifyOTP` also uses a
        // constant-time comparison.
        if (
            !OTPBoot.verifyOTP(
                { userId, email },
                otp,
                challenge.expiresAt.getTime()
            )
        ) {
            return false;
        }

        // Only the caller that atomically flips `consumed` wins; a concurrent
        // verification of the same code gets modifiedCount 0 and is rejected.
        const claimed = await OtpChallengeModel.updateOne(
            { key, consumed: false },
            { $set: { consumed: true } }
        );
        return claimed.modifiedCount === 1;
    }
}

const otpChallengeService = new OtpChallengeService();
export default otpChallengeService;
