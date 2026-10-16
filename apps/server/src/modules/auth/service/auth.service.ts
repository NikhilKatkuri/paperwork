import config from '@/config';
import UserModel from '@/modules/auth/schemas/user.schema';
import ProfileModel from '@/modules/auth/schemas/profile.schema';
import crypto from 'node:crypto';
import TokenBoot from './token.service';
import UserRepoBoot from '../repository/user.repository';
import OTPBoot from './otp.service';
import ProfileRepoBoot from '../repository/profile.repository';
import statusCodes from 'http-status-codes';
import HashBoot from './hash.service';

import { Request, Response } from 'express';
import { AppError } from '@/utils/AppError';
import { emailQueue } from '@/queues';
import { AutoBoundController } from '@/utils/AutoBoundClass';

import { generateHSL, HSLtoString } from '../utils/randomprofiepicture';

import mongoose from 'mongoose';
import {
    SignInService,
    SignUpService,
    TokenPayload,
    User,
} from '@paperwork/types';
import { MongooseDocument } from '@/types';

class AuthService extends AutoBoundController {
    constructor() {
        super();
    }

    signUp = async ({ email, password, fullName }: SignUpService) => {
        const existingUser = await UserRepoBoot.findUserByEmail(email);
        if (existingUser) {
            throw AppError.Conflict('Email already in use');
        }

        const hashedPassword = await HashBoot.hashed(password);
        const session = await mongoose.startSession();

        let newUser: any;
        try {
            newUser = await session.withTransaction(async () => {
                const created = await UserModel.create(
                    [{ email, passwordHash: hashedPassword }],
                    { session }
                );

                const userId = created[0]!
                    ._id satisfies mongoose.Types.ObjectId;

                const color = HSLtoString(generateHSL(fullName));
                const avatarUrl = `randomuser:name=${encodeURIComponent(fullName)}&color=${encodeURIComponent(color)}`;

                await ProfileModel.create([{ userId, fullName, avatarUrl }], {
                    session,
                });

                return created[0]!;
            });
        } finally {
            await session.endSession();
        }

        // Side-effect outside the transaction: a rollback must not send mail,
        // and a mail-queue failure must not roll back a committed user.
        // Fire-and-forget with a logged catch so signup never 500s on Redis.
        emailQueue
            .add(
                'sendWelcomeEmail',
                { email, fullName },
                {
                    attempts: 10,
                    backoff: { type: 'exponential', delay: 60 * 1000 },
                }
            )
            .catch(() => undefined);

            const tokens = {
                accessToken: TokenBoot.generateToken({
                    userId: newUser!._id.toString(),
                    email: newUser!.email,
                }),
                refreshToken: TokenBoot.generateToken(
                    {
                        userId: newUser!._id.toString(),
                        email: newUser!.email,
                    },
                    'refresh'
                ),
            };

            return tokens;
    };

    signIn = async ({
        payload,
        geo,
        device,
        res,
    }: {
        payload: SignInService;
        geo: string;
        device: string;
        res: Response;
    }) => {
        const { email, password } = payload;
        const user: MongooseDocument<User> | null =
            await UserRepoBoot.findUserByEmail(email, true);

        if (!user) {
            throw AppError.Unauthorized('Invalid email or password');
        }
        // Block deactivated / soft-deleted accounts. Pending-deletion alone
        // does not block — it is cleared below on successful password check
        // only if the grace period has not expired.
        if (
            (user as any).accountDeactivationStatus === 'DEACTIVATED' ||
            (user as any).accountDeletedStatus === 'DELETED'
        ) {
            throw AppError.Forbidden('Account is deactivated or deleted');
        }
        if (
            user.accountWillbeDeletedAt &&
            new Date() > new Date(user.accountWillbeDeletedAt)
        ) {
            throw AppError.Unauthorized('Invalid email or password');
        }

        const isPasswordValid = await HashBoot.verifyHash(
            password,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw AppError.Unauthorized('Invalid email or password');
        }

        const userId = user.toObject()._id.toString();
        await UserRepoBoot.clearDeletionFlag(userId);

        if (user.twofactorEnabled) {
            return this.otpFor2FA(userId, email, res);
        }

        return this.cookieForSignIn({ email, device, geo, userId, res });
    };

    private async otpFor2FA(userId: string, email: string, res: Response) {
        const { otp, expiresAt } = OTPBoot.generateOTP({ userId, email });

        // Do not block sign-in on mail outage; queue with retries instead.
        emailQueue
            .add(
                'sendOTPEmail',
                { email, otp, expiresAt },
                {
                    attempts: 5,
                    backoff: { type: 'exponential', delay: 5 * 1000 },
                }
            )
            .catch(() => undefined);

        const tempAccessToken = TokenBoot.generateToken(
            { userId, email },
            'temp'
        );

        // Cookie lifetime matches OTP lifetime so a stale cookie cannot
        // outlive the code (previously 15m vs 5m OTP).
        const ttlMs = Math.max(
            60 * 1000,
            expiresAt - Date.now()
        );

        this.cookieSetter(
            res,
            'Expiry2faAt',
            expiresAt.toString(),
            ttlMs
        );

        this.cookieSetter(
            res,
            'tempAccessToken',
            tempAccessToken,
            ttlMs
        );

        res.status(statusCodes.OK).json({
            success: true,
            twoFactorRequired: true,
            message: '2FA OTP sent to your email. Please verify.',
        });
    }

    private async cookieForSignIn({
        userId,
        email,
        device,
        res,
        geo,
    }: {
        userId: string;
        email: string;
        device: string;
        geo: string;
        res: Response;
    }) {
        // Fire-and-forget: login must not fail when Redis/mail is down.
        emailQueue
            .add(
                'sendLoginAlertEmail',
                {
                    email,
                    device,
                    location: geo,
                    time: new Date().toISOString(),
                },
                {
                    attempts: 10,
                    backoff: { type: 'exponential', delay: 20 * 1000 },
                }
            )
            .catch(() => undefined);

        const accessToken = TokenBoot.generateToken({ userId, email });
        const refreshToken = TokenBoot.generateToken(
            { userId, email },
            'refresh'
        );

        this.cookieSetter(
            res,
            'refreshToken',
            refreshToken,
            7 * 24 * 60 * 60 * 1000
        );

        res.status(statusCodes.OK).json({
            success: true,
            message: 'User signed in successfully',
            accessToken,
        });
    }

    verify2FA = async ({
        otp,
        geo,
        device,
        res,
        req,
    }: {
        otp: string;
        geo: string;
        device: string;
        res: Response;
        req: Request;
    }) => {
        const twoFAExpireAt = req.cookies?.Expiry2faAt;
        const tempToken = req.cookies?.tempAccessToken;

        if (!twoFAExpireAt || !tempToken) {
            throw AppError.BadRequest(
                '2FA session has expired or is invalid. Please sign in again.'
            );
        }

        let decodedTempToken: TokenPayload;
        try {
            decodedTempToken = TokenBoot.verifyToken<TokenPayload>(
                tempToken,
                'temp'
            );
        } catch (error) {
            throw AppError.BadRequest(
                'Invalid or expired temporary session. Please sign in again.'
            );
        }

        if (!decodedTempToken?.userId || !decodedTempToken?.email) {
            throw AppError.BadRequest(
                'Invalid session payload. Please sign in again.'
            );
        }

        // Never trust the client-supplied expiry blindly: clamp it to the
        // server OTP window so an attacker cannot extend brute-force time
        // by forging a far-future cookie.
        const parsedExpiry = Number.parseInt(String(twoFAExpireAt), 10);
        if (!Number.isFinite(parsedExpiry)) {
            throw AppError.BadRequest(
                '2FA session has expired or is invalid. Please sign in again.'
            );
        }
        const maxAllowed = Date.now() + config.otp.EXPIRATION + 60_000;
        if (parsedExpiry > maxAllowed) {
            throw AppError.BadRequest(
                '2FA session has expired or is invalid. Please sign in again.'
            );
        }

        const isValid = OTPBoot.verifyOTP(
            { userId: decodedTempToken.userId, email: decodedTempToken.email },
            otp,
            parsedExpiry
        );

        if (!isValid) {
            throw AppError.BadRequest(
                'Invalid or expired OTP. Please try again.'
            );
        }

        this.clearCookie(res, 'tempAccessToken');
        this.clearCookie(res, 'Expiry2faAt');

        return this.cookieForSignIn({
            userId: decodedTempToken.userId,
            email: decodedTempToken.email,
            device,
            geo,
            res,
        });
    };

    refreshTokenService = async ({
        userId,
        email,
    }: {
        userId: string;
        email: string;
    }) => {
        const user = await UserModel.findById(userId).lean();
        if (!user) {
            throw AppError.Unauthorized('User no longer exists');
        }
        if (
            (user as any).accountDeactivationStatus === 'DEACTIVATED' ||
            (user as any).accountDeletedStatus === 'DELETED'
        ) {
            throw AppError.Forbidden('Account is deactivated or deleted');
        }

        return {
            newAccessToken: TokenBoot.generateToken(
                { userId, email },
                'access'
            ),
            newRefreshToken: TokenBoot.generateToken(
                { userId, email },
                'refresh'
            ),
        };
    };

    getProfileService = async (userId: string) => {
        try {
            const profile = await ProfileRepoBoot.findByUserId(userId, {
                sensitiveData: 0,
            });
            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }
            return profile.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to retrieve profile. Please try again.'
            );
        }
    };

    updateProfileService = async (
        userId: string,
        updateData: { fullName?: string; avatarUrl?: string; bio?: string }
    ) => {
        try {
            // Strip undefined so partial PATCH cannot null/unset fields.
            const clean = Object.fromEntries(
                Object.entries(updateData).filter(([, v]) => v !== undefined)
            );
            if (Object.keys(clean).length === 0) {
                throw AppError.BadRequest('No update data provided');
            }
            const profile = await ProfileRepoBoot.updateProfile(
                userId,
                clean,
                {
                    sensitiveData: 0,
                }
            );
            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }
            return profile.toJSON();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to update profile. Please try again.'
            );
        }
    };

    sendVerificationService = async (
        userId: string,
        email: string
    ): Promise<number> => {
        try {
            const user = await UserRepoBoot.findUserById(userId.toString());
            if (!user) {
                throw AppError.NotFound('User not found');
            }
            if (user.isVerified) {
                throw AppError.BadRequest('Email is already verified');
            }

            const { otp, expiresAt } = OTPBoot.generateOTP({
                userId,
                email,
            });

            await emailQueue.add(
                'sendVerificationEmail',
                { email, otp, expiresAt },
                {
                    attempts: 2,
                    backoff: { type: 'exponential', delay: 5 * 1000 },
                }
            );

            return expiresAt;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to send verification OTP. Please check email configuration.'
            );
        }
    };

    verifyEmailService = async (
        userId: string,
        email: string,
        otp: string,
        expiresAt: number
    ) => {
        const parsed = Number(expiresAt);
        if (!Number.isFinite(parsed)) {
            throw AppError.BadRequest(
                'Invalid or expired OTP. Please request a new one.'
            );
        }
        // Clamp client-supplied expiry to the server window.
        if (parsed > Date.now() + config.otp.EXPIRATION + 60_000) {
            throw AppError.BadRequest(
                'Invalid or expired OTP. Please request a new one.'
            );
        }
        const isValid = OTPBoot.verifyOTP({ email, userId }, otp, parsed);
        if (!isValid) {
            throw AppError.BadRequest(
                'Invalid or expired OTP. Please request a new one.'
            );
        }

        try {
            await UserRepoBoot.findUserByIdAndUpdateFeilds(userId, {
                isVerified: true,
            });
        } catch (error) {
            throw AppError.Internal('Failed to verify OTP. Please try again.');
        }
    };

    changePasswordService = async (
        userId: string,
        currentPassword: string,
        newPassword: string
    ) => {
        try {
            const user = await UserRepoBoot.findUserById(
                userId,
                '+passwordHash'
            );
            if (!user) {
                throw AppError.Unauthorized('User not found');
            }

            const isMatch = await HashBoot.verifyHash(
                currentPassword,
                user.passwordHash
            );
            if (!isMatch) throw AppError.Unauthorized('Incorrect password');

            const isSameAsOld = await HashBoot.verifyHash(
                newPassword,
                user.passwordHash
            );
            if (isSameAsOld) {
                throw AppError.BadRequest(
                    'New password must be different from the current password'
                );
            }

            user.passwordHash = await HashBoot.hashed(newPassword);
            await user.save();

            await emailQueue.add(
                'sendPasswordChangeAlertEmail',
                { email: user.email, time: new Date().toISOString() },
                {
                    attempts: 5,
                    backoff: { type: 'exponential', delay: 20 * 1000 },
                }
            );

            return 'Password has been changed successfully.';
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to change password. Please try again.'
            );
        }
    };

    forgotPasswordService = async (email: string) => {
        try {
            const user = await UserRepoBoot.findUserByEmail(email, true);
            if (user) {
                const token = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex');

                user.resetToken = hashedToken;
                user.resetExpires = new Date(Date.now() + 15 * 60 * 1000);
                await user.save();

                // The JWT carries the SAME raw token so reset can verify
                // signature first, then compare hashes. Previously the JWT
                // was hashed directly (never matching) and never verified.
                const jwtToken = TokenBoot.generateToken(
                    { token, email: user.email },
                    'resetPassword'
                );
                const resetLink = `${config.WEB_URL}/auth/reset-password/${jwtToken}`;

                await emailQueue.add(
                    'sendForgotPasswordEmail',
                    { email, resetLink },
                    {
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 20 * 1000 },
                    }
                );
            }
            return 'If an account with that email exists, a password reset link has been sent.';
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to initiate password reset. Please try again.'
            );
        }
    };

    resetPasswordService = async (token: string, newPassword: string) => {
        try {
            // Token param is the JWT issued by forgot-password. Verify its
            // signature first to reject forged links, then use the embedded
            // raw token for the DB hash comparison.
            let rawToken: string;
            try {
                const decoded = TokenBoot.verifyToken<{ token: string }>(
                    token,
                    'resetPassword'
                );
                rawToken = decoded.token;
                if (!rawToken || typeof rawToken !== 'string') {
                    return 'If the token is valid, your password has been reset successfully.';
                }
            } catch {
                return 'If the token is valid, your password has been reset successfully.';
            }
            const hashedToken = crypto
                .createHash('sha256')
                .update(rawToken)
                .digest('hex');
            const user = await UserModel.findOne({
                resetToken: hashedToken,
                resetExpires: { $gt: new Date() },
            });

            if (user) {
                user.passwordHash = await HashBoot.hashed(newPassword);
                user.resetToken = null as unknown as string;
                user.resetExpires = null as unknown as Date;
                await user.save();

                await emailQueue.add(
                    'sendPasswordResetSuccessEmail',
                    { email: user.email },
                    {
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 30 * 1000 },
                    }
                );
            }
            return 'If the token is valid, your password has been reset successfully.';
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to reset password. Please try again.'
            );
        }
    };

    checkEmailExists = async (email: string) => {
        try {
            const user = await UserRepoBoot.findUserByEmail(email);
            return !!user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw AppError.Internal(
                'Failed to check email. Please try again later.'
            );
        }
    };
}

const AuthServiceBoot = new AuthService();
export default AuthServiceBoot;
