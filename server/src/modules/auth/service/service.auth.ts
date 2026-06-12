import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '@/utils/AppError';
import config from '@/config';
import UserModel from '@/modules/auth/schemas/schema.user';
import ProfileModel from '@/modules/auth/schemas/schema.profile';
import { SignInService, SignUpService } from '@/modules/auth/types/types.auth';
import OTP from '@/utils/otp';
import crypto from 'crypto';
import { emailQueue } from '@/queues';

const genAccessToken = (payload: any) => {
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '60m' });
    return token;
};

const genRefreshToken = (payload: any) => {
    const token = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
    return token;
};

class AuthService {
    signUp = async ({
        email,
        password,
        fullName,
        avatarUrl = null,
        bio = '',
    }: SignUpService) => {
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            throw AppError.Conflict('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(config.SALT_ROUNDS)
        );
        const newUser = new UserModel({
            email,
            passwordHash: hashedPassword,
        });

        await newUser.save();

        const profileData = {
            userId: newUser._id,
            fullName,
            avatarUrl,
            bio,
        };

        const profile = new ProfileModel(profileData);
        await profile.save();
        await emailQueue.add(
            'sendWelcomeEmail',
            { email, fullName },
            {
                attempts: 10,
                backoff: { type: 'exponential', delay: 60 * 1000 },
            }
        );

        return {
            accessToken: genAccessToken({
                userId: newUser._id,
                email: newUser.email,
            }),
            refreshToken: genRefreshToken({
                userId: newUser._id,
                email: newUser.email,
            }),
        };
    };

    signIn = async ({
        payload,
        geo,
        device,
    }: {
        payload: SignInService;
        geo: string;
        device: string;
    }) => {
        const { email, password } = payload;
        const user = await UserModel.findOne({ email }).select('+passwordHash');
        if (!user) {
            throw AppError.Unauthorized('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw AppError.Unauthorized('Invalid email or password');
        }

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

        return {
            accessToken: genAccessToken({
                userId: user._id,
                email: user.email,
            }),
            refreshToken: genRefreshToken({
                userId: user._id,
                email: user.email,
            }),
        };
    };

    refreshTokenService = async ({
        userId,
        email,
    }: {
        userId: string;
        email: string;
    }) => {
        return {
            newAccessToken: genAccessToken({ userId, email }),
            newRefreshToken: genRefreshToken({ userId, email }),
        };
    };

    getProfileService = async (userId: string) => {
        try {
            const profile = await ProfileModel.findOne({ userId });
            if (!profile) {
                throw AppError.NotFound('Profile not found');
            }
            return profile.toObject();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal(
                'Failed to retrieve profile. Please try again.'
            );
        }
    };

    sendVerificationService = async (
        userId: string,
        email: string
    ): Promise<number> => {
        try {
            const user = await UserModel.findById(userId.toString());
            if (!user) {
                throw AppError.NotFound('User not found');
            }
            if (user.isVerified) {
                throw AppError.BadRequest('Email is already verified');
            }

            const { otp, expiresAt } = new OTP().generateOTP(userId, email);

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
            if (error instanceof AppError) {
                throw error;
            }
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
        try {
            const isValid = new OTP().verifyOTP(userId, email, otp, expiresAt);

            if (!isValid) {
                throw AppError.BadRequest(
                    'Invalid or expired OTP. Please request a new one.'
                );
            }

            await UserModel.findByIdAndUpdate(userId, {
                isVerified: true,
            });
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal('Failed to verify OTP. Please try again.');
        }
    };

    changePasswordService = async (
        userId: string,
        currentPassword: string,
        newPassword: string
    ) => {
        try {
            const user = await UserModel.findById(userId);
            if (user) {
                const isMatch = await bcrypt.compare(
                    currentPassword,
                    user.passwordHash
                );

                if (!isMatch) throw AppError.Unauthorized('Incorrect password');

                const isSameAsOld = await bcrypt.compare(
                    newPassword,
                    user.passwordHash
                );

                if (isSameAsOld)
                    throw AppError.BadRequest(
                        'New password must be different from the current password'
                    );

                const newHash = await bcrypt.hash(
                    newPassword,
                    Number(config.SALT_ROUNDS)
                );

                user.passwordHash = newHash;
                await emailQueue.add(
                    'sendPasswordChangeAlertEmail',
                    { email: user.email, time: new Date().toISOString() },
                    {
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 20 * 1000 },
                    }
                );

                await user.save();
                return 'password has been changed successfully.';
            }

            return 'if the user exists, the password has been changed successfully.';
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal(
                'Failed to change password. Please try again.'
            );
        }
    };

    forgotPasswordService = async (email: string) => {
        try {
            const user = await UserModel.findOne({ email });
            if (user) {
                const token = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex');

                user.resetToken = hashedToken;
                user.resetExpires = new Date(Date.now() + 15 * 60 * 1000);
                await user.save();

                const resetLink = `http://localhost:5000/api/v1/auth/reset-password/${token}`;

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
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal(
                'Failed to send password reset email. Please check email configuration.'
            );
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
                const hashedPassword = await bcrypt.hash(
                    newPassword,
                    Number(config.SALT_ROUNDS)
                );
                user.passwordHash = hashedPassword;
                user.resetToken = undefined;
                user.resetExpires = undefined;
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
            if (error instanceof AppError) {
                throw error;
            }
            throw AppError.Internal(
                'Failed to reset password. Please try again.'
            );
        }
    };

    checkEmailExists = async (email: string) => {
        try {
            const user = await UserModel.findOne({ email });
            return !!user;
        } catch (error) {
            console.error('Database error inside checkEmailExists:', error);
            throw AppError.Internal(
                'Failed to check email. Please try again later.'
            );
        }
    };
}

export default AuthService;
