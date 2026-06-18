import { NextFunction, Response } from 'express';
import statusCodes from 'http-status-codes';
import { AppError } from '@/utils/AppError';
import { Request } from 'express';
import TokenBoot from '../service/token.service';
import { TokenPayload } from '../types/token.types';
import { AutoBoundController } from '@/utils/AutoBoundClass';
import AuthServiceBoot from '@/modules/auth/service/auth.service';
import userAgentService from '../service/userAgent.service';
import HashBoot from '../service/hash.service';

interface EmailCheckCookie {
    last_check_email: string;
    result: boolean;
}

class AuthController extends AutoBoundController {
    private email_check_cache = 'email_check_cache';

    constructor() {
        super();
    }

    async signInController(req: Request, res: Response, next: NextFunction) {
        try {
            const meta = userAgentService.getMeta(req);
            const { email, password } = req.body;
            await AuthServiceBoot.signIn({
                payload: { email, password },
                geo: Object.values(meta).join(', '),
                device: Object.values(meta).join(','),
                res,
            });
        } catch (error) {
            next(error);
        }
    }

    async verify2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const { otp } = req.params;
            if (!otp) {
                throw AppError.BadRequest('OTP is required');
            }
            const meta = userAgentService.getMeta(req);
            await AuthServiceBoot.verify2FA({
                otp: otp.toString(),
                geo: Object.values(meta).join(', '),
                device: Object.values(meta).join(','),
                res,
                req,
            });
        } catch (error) {
            next(error);
        }
    }

    async signUpController(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, fullName } = req.body;
            const { accessToken, refreshToken } = await AuthServiceBoot.signUp({
                email,
                password,
                fullName,
            });

            this.cookieSetter(res, 'refreshToken', refreshToken);

            res.status(statusCodes.CREATED).json({
                success: true,
                message: 'User registered successfully',
                accessToken,
            });
        } catch (error) {
            next(error);
        }
    }

    async signOutController(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw AppError.Unauthorized('No refresh token provided');
            }

            this.clearCookie(res, 'refreshToken');

            res.status(statusCodes.OK).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshTokenController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw AppError.Unauthorized('No refresh token provided');
            }
            let decode: TokenPayload | null = null;
            try {
                decode = await TokenBoot.verifyToken<TokenPayload>(
                    refreshToken,
                    'refresh'
                );
                if (!decode.userId || !decode.email) {
                    throw AppError.Unauthorized('Invalid refresh token');
                }
            } catch (jwterror) {
                throw AppError.Unauthorized('Invalid or expired refresh token');
            }

            if (!decode || !decode.userId || !decode.email) {
                throw AppError.Unauthorized('Invalid refresh token');
            }

            const { newAccessToken, newRefreshToken } =
                await AuthServiceBoot.refreshTokenService({
                    userId: decode.userId,
                    email: decode.email,
                });

            this.cookieSetter(res, 'refreshToken', newRefreshToken);

            res.status(statusCodes.OK).json({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: newAccessToken,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfileController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = this.getContext(req);
            const profile = await AuthServiceBoot.getProfileService(userId);
            res.status(statusCodes.OK).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { profile },
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfileController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = this.getContext(req);
            const { fullName, avatarUrl, bio } = req.body;
            const profile = await AuthServiceBoot.updateProfileService(userId, {
                fullName,
                avatarUrl,
                bio,
            });

            res.status(statusCodes.OK).json({
                success: true,
                message: 'Profile updated successfully',
                data: { profile },
            });
        } catch (error) {
            next(error);
        }
    }

    async sendVerificationController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId, email } = this.getContext(req);

            const r = await AuthServiceBoot.sendVerificationService(
                userId,
                email
            );

            this.cookieSetter(
                res,
                'emailVerification',
                JSON.stringify({ expiresAt: r }),
                5 * 60 * 1000
            );

            res.status(statusCodes.OK).json({
                success: true,
                message: `Verification OTP sent to ${email}`,
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmailController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
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

            await AuthServiceBoot.verifyEmailService(
                userId,
                email,
                otp,
                verificationData.expiresAt
            );

            this.clearCookie(res, 'emailVerification');

            res.status(statusCodes.OK).json({
                success: true,
                message: 'Email verified successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async changePasswordController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = this.getContext(req);
            const { currentPassword, newPassword } = req.body;

            await AuthServiceBoot.changePasswordService(
                userId,
                currentPassword,
                newPassword
            );
            res.status(statusCodes.OK).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async forgotPasswordController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email } = req.body;
            await AuthServiceBoot.forgotPasswordService(email);
            res.status(statusCodes.OK).json({
                success: true,
                message: 'Password reset instructions sent to your email',
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPasswordController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { token } = req.params as { token: string };
            if (!token) {
                throw AppError.BadRequest('Invalid or missing token');
            }

            const { newPassword } = req.body;

            const message = await AuthServiceBoot.resetPasswordService(
                token,
                newPassword
            );

            res.status(statusCodes.OK).json({
                success: true,
                message,
            });
        } catch (error) {
            next(error);
        }
    }

    async checkEmailController(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email } = req.body;

            const targetEmailHash = HashBoot.hashEmail(email.toLowerCase());

            if (req.cookies[this.email_check_cache]) {
                try {
                    const lastCheckedEmailHash: EmailCheckCookie = JSON.parse(
                        req.cookies[this.email_check_cache]
                    );
                    if (
                        lastCheckedEmailHash.last_check_email ===
                        targetEmailHash
                    ) {
                        res.status(statusCodes.OK).json({
                            success: true,
                            message: 'Email check completed (cached)',
                            exists: lastCheckedEmailHash.result,
                        });
                        return;
                    }
                } catch (error) {
                    console.warn(
                        'Failed to parse email check cache cookie, ignoring cache'
                    );
                }
            }

            const exists = await AuthServiceBoot.checkEmailExists(
                email.toLowerCase()
            );

            this.cookieSetter(
                res,
                this.email_check_cache,
                JSON.stringify({
                    last_check_email: targetEmailHash,
                    result: exists,
                }),
                10 * 60 * 1000
            );

            res.status(statusCodes.OK).json({
                success: true,
                message: 'Email check completed',
                exists,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
