import { NextFunction, Response } from 'express';
import statusCodes, { StatusCodes } from 'http-status-codes';
import AuthService from '@/modules/auth/service/service.auth';
import config from '@/config';
import { AppError } from '@/utils/AppError';
import jwt from 'jsonwebtoken';
import { CustomAuthRequest as Request } from '@/types';

class AuthController {
    authService = new AuthService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            AuthController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getContext(req: Request) {
        const { id: userId, email } = req.user || {};
        if (!userId || !email) {
            throw AppError.Unauthorized('User not authenticated');
        }
        return { userId, email };
    }

    signInController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken } = await this.authService.signIn(
                {
                    email,
                    password,
                }
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(statusCodes.OK).json({
                success: true,
                message: 'User signed in successfully',
                accessToken,
            });
        } catch (error) {
            next(error);
        }
    };

    signUpController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const {
            email,
            password,
            fullName,
            avatarUrl = null,
            bio = '',
        } = req.body;
        try {
            const { accessToken, refreshToken } = await this.authService.signUp(
                {
                    email,
                    password,
                    fullName,
                    avatarUrl,
                    bio,
                }
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(statusCodes.CREATED).json({
                success: true,
                message: 'User registered successfully',
                accessToken,
            });
        } catch (error) {
            next(error);
        }
    };

    signOutController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw AppError.Unauthorized('No refresh token provided');
            }
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: config.env === 'production',
                sameSite: 'strict',
            });

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    refreshTokenController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw AppError.Unauthorized('No refresh token provided');
            }
            let decode;
            try {
                decode = jwt.verify(
                    refreshToken,
                    config.JWT_REFRESH_SECRET
                ) as {
                    userId: string;
                    email: string;
                };
            } catch (jwterror) {
                throw AppError.Unauthorized('Invalid or expired refresh token');
            }

            if (!decode || !decode.userId || !decode.email) {
                throw AppError.Unauthorized('Invalid refresh token');
            }

            const { newAccessToken, newRefreshToken } =
                await this.authService.refreshTokenService({
                    userId: decode.userId,
                    email: decode.email,
                });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: config.env === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: newAccessToken,
            });
        } catch (error) {
            next(error);
        }
    };

    getProfileController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { userId } = this.getContext(req);
            const profile = await this.authService.getProfileService(userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { profile },
            });
        } catch (error) {
            next(error);
        }
    };

    sendVerificationController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { userId, email } = this.getContext(req);

            const r = await this.authService.sendVerificationService(
                userId,
                email
            );

            res.cookie(
                'emailVerification',
                JSON.stringify({
                    expiresAt: r,
                }),
                {
                    httpOnly: true,
                    secure: config.env === 'production',
                    sameSite: 'strict',
                    maxAge: 5 * 60 * 1000,
                }
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: `Verification OTP sent to ${email}`,
            });
        } catch (error) {
            next(error);
        }
    };

    verifyEmailController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { userId, email } = this.getContext(req);
            const { otp } = req.body;

            const emailVerificationCookie = req.cookies?.emailVerification;
            if (!emailVerificationCookie) {
                throw AppError.BadRequest(
                    'No OTP found. Please request a new one.'
                );
            }

            let verificationData;
            try {
                verificationData = JSON.parse(emailVerificationCookie);
            } catch {
                throw AppError.BadRequest(
                    'Invalid OTP data. Please request a new one.'
                );
            }

            await this.authService.verifyEmailService(
                userId,
                email,
                otp,
                verificationData.expiresAt
            );

            res.clearCookie('emailVerification');
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Email verified successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    changePasswordController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { userId } = this.getContext(req);
            const { currentPassword, newPassword } = req.body;

            await this.authService.changePasswordService(
                userId,
                currentPassword,
                newPassword
            );
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    forgotPasswordController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { email } = this.getContext(req);
            await this.authService.forgotPasswordService(email);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Password reset instructions sent to your email',
            });
        } catch (error) {
            next(error);
        }
    };

    resetPasswordController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { token } = req.params as { token: string };
            if (!token) {
                throw AppError.BadRequest('Invalid or missing token');
            }

            const { newPassword } = req.body;

            const message = await this.authService.resetPasswordService(
                token,
                newPassword
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message,
            });
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;
