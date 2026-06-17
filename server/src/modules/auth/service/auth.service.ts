import config from '@/config';
import UserModel from '@/modules/auth/schemas/user.schema';
import ProfileModel from '@/modules/auth/schemas/profile.schema';
import crypto from 'crypto';
import TokenBoot from './token.service';
import UserRepoBoot from '../repository/user.repository';
import OTPBoot from './otp.service';
import ProfileRepoBoot from '../repository/profile.repository';
import statusCodes from 'http-status-codes';
import MailService from '@/utils/mail';
import HashBoot from './hash.service';
import { Request } from 'express';
import { AppError } from '@/utils/AppError';
import { SignInService, SignUpService } from '@/modules/auth/types/auth.types';
import { emailQueue } from '@/queues';
import { Response } from 'express';
import { UserDocument } from '../types/user.auth';
import { AutoBoundController } from '@/utils/AutoBoundClass';
import { TokenPayload } from '../types/token.types';
import { Profile } from '../types/profile.auth';
import mongoose from 'mongoose';

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

        try {
            let tokens;
            await session.withTransaction(async () => {
                const newUser = await UserModel.create(
                    [{ email, passwordHash: hashedPassword }],
                    { session }
                );

                const userId = newUser[0]!._id.toString();

                await ProfileModel.create([{ userId, fullName }], { session });

                await emailQueue.add(
                    'sendWelcomeEmail',
                    { email, fullName },
                    {
                        attempts: 10,
                        backoff: { type: 'exponential', delay: 60 * 1000 },
                    }
                );

                tokens = {
                    accessToken: TokenBoot.generateToken({
                        userId,
                        email: newUser[0]!.email,
                    }),
                    refreshToken: TokenBoot.generateToken(
                        { userId, email: newUser[0]!.email },
                        'refresh'
                    ),
                };
            });

            return tokens;
        } finally {
            await session.endSession();
        }
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
        const user: UserDocument | null =
            await UserRepoBoot.findUserByEmail(email);

        if (
            !user ||
            (user.accountWillbeDeletedAt &&
                new Date() > new Date(user.accountWillbeDeletedAt))
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

        const userId = user._id.toString();
        await UserRepoBoot.clearDeletionFlag(userId);

        if (user.twofactorEnabled) {
            return this.otpFor2FA(userId, email, res);
        }

        return this.cookieForSignIn({ email, device, geo, userId, res });
    };

    private async otpFor2FA(userId: string, email: string, res: Response) {
        const { otp, expiresAt } = await OTPBoot.generateOTP({ userId, email });

        await new MailService().sendOTPEmail(
            email,
            otp,
            `Your 2FA verification code - expires at ${new Date(expiresAt).toLocaleString()}`
        );

        const tempAccessToken = TokenBoot.generateToken(
            { userId, email },
            'temp'
        );

        this.cookieSetter(
            res,
            'Expiry2faAt',
            expiresAt.toString(),
            15 * 60 * 1000
        );
        this.cookieSetter(
            res,
            'tempAccessToken',
            tempAccessToken,
            15 * 60 * 1000
        );

        res.status(statusCodes.OK).json({
            success: true,
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
        await emailQueue.add(
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
        );

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

        if (
            !decodedTempToken ||
            !decodedTempToken.userId ||
            !decodedTempToken.email
        ) {
            throw AppError.BadRequest(
                'Invalid session payload. Please sign in again.'
            );
        }

        const isValid = await OTPBoot.verifyOTP(
            { userId: decodedTempToken.userId, email: decodedTempToken.email },
            otp,
            parseInt(twoFAExpireAt)
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
        const user = await UserModel.findById(userId);
        if (!user) {
            throw AppError.Unauthorized('User no longer exists');
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
            const profile = await ProfileRepoBoot.findByUserId(
                userId,
                'userId fullName avatarUrl bio'
            );

            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }

            return profile;
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
            const profile = await ProfileRepoBoot.updateProfile<Profile>(
                userId,
                updateData
            );
            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }
            return profile;
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

            const { otp, expiresAt } = await OTPBoot.generateOTP({
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
        const isValid = await OTPBoot.verifyOTP(
            { email, userId },
            otp,
            expiresAt
        );
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
            const user = await UserRepoBoot.findUserByEmail(email);
            if (user) {
                const token = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex');

                user.resetToken = hashedToken;
                user.resetExpires = new Date(Date.now() + 15 * 60 * 1000);
                await user.save();

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
            return 'If an account with that email exists, a password reset link has been sent.';
        }
    };

    resetPasswordService = async (token: string, newPassword: string) => {
        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');
            const user = await UserModel.findOne({
                resetToken: hashedToken,
                resetExpires: { $gt: new Date() },
            });

            if (user) {
                user.passwordHash = await HashBoot.hashed(newPassword);
                await UserRepoBoot.clearResets(user._id.toString());
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
            throw AppError.Internal(
                'Failed to check email. Please try again later.'
            );
        }
    };
}

const AuthServiceBoot = new AuthService();
export default AuthServiceBoot;
