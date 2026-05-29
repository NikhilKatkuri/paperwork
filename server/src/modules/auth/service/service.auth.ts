import jwt from 'jsonwebtoken';
import bycrpt from 'bcryptjs';
import { AppError } from '@/utils/AppError';
import config from '@/config';
import UserModel from '@/modules/auth/schemas/schema.user';
import ProfileModel from '@/modules/auth/schemas/schema.profile';
import { SignInService, SignUpService } from '@/modules/auth/types/types.auth';
import OTP from '@/utils/otp';
import MailService from '@/utils/mail/index';

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

        const hashedPassword = bycrpt.hashSync(password, config.SALT_ROUNDS);
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
        new MailService().sendWelcomeEmail(email, fullName);
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

    signIn = async ({ email, password }: SignInService) => {
        const user = await UserModel.findOne({ email }).select('+passwordHash');
        if (!user) {
            throw AppError.Unauthorized('Invalid email or password');
        }

        const isPasswordValid = bycrpt.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
            throw AppError.Unauthorized('Invalid email or password');
        }

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
        const profile = await ProfileModel.findOne({ userId });
        if (!profile) {
            throw AppError.NotFound('Profile not found');
        }
        return profile.toObject();
    };

    sendVerificationService = async (
        userId: string,
        email: string
    ): Promise<number> => {
        try {
            const usr = await UserModel.findById(userId.toString());
            if (!usr) {
                throw AppError.NotFound('User not found');
            }
            if (usr.isVerified) {
                throw AppError.BadRequest('Email is already verified');
            }

            const { otp, expiresAt } = new OTP().generateOTP(userId, email);
            await new MailService().sendOTPEmail(email, parseInt(otp, 10));
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
}

export default AuthService;
