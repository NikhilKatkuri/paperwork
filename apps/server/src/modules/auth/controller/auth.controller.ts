import { NextFunction, Response, Request } from 'express';
import statusCodes from 'http-status-codes';
import { AppError } from '@/utils/AppError';
import TokenBoot from '../service/token.service';
import { TokenPayload } from '@paperwork/types';
import { AutoBoundController } from '@/utils/AutoBoundClass';
import AuthServiceBoot from '@/modules/auth/service/auth.service';
import userAgentService from '../service/userAgent.service';
import HashBoot from '../service/hash.service';
import { cacheLogger } from '@/utils/logger';
import {
    logMaskedSecurityEvent,
    logSecurityEvent,
    SECURITY_EVENTS,
} from '@/utils/securityAudit';

interface EmailCheckCookie {
    last_check_email: string;
    result: boolean;
}

class AuthController extends AutoBoundController {
    private readonly email_check_cache = 'email_check_cache';

    constructor() {
        super();
    }

    async signInController(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            // One metadata snapshot per request: device/location labels and
            // the masked IP all come from the same trusted-proxy-aware parse.
            const labels = userAgentService.getSecurityLabels(req);

            await AuthServiceBoot.signIn({
                payload: { email, password },
                geo: labels.location,
                device: labels.device,
                ip: labels.ip ?? undefined,
                res,
            });
        } catch (error) {
            // Credential rejections are logged masked at the source so brute
            // force is visible without the log store becoming a list of
            // addresses. Server faults (5xx) are not authentication decisions
            // and stay out of the security trail.
            if (
                error instanceof AppError &&
                (error.statusCode === statusCodes.UNAUTHORIZED ||
                    error.statusCode === statusCodes.FORBIDDEN)
            ) {
                logMaskedSecurityEvent(SECURITY_EVENTS.SIGNIN_FAILED, req, {
                    stage: 'password',
                    reason:
                        error.statusCode === statusCodes.UNAUTHORIZED
                            ? 'invalid_credentials'
                            : 'account_disabled',
                    statusCode: error.statusCode,
                });
            }
            next(error);
        }
    }

    async verify2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const { otp } = req.params;
            if (!otp) {
                throw AppError.BadRequest('OTP is required');
            }
            const labels = userAgentService.getSecurityLabels(req);

            await AuthServiceBoot.verify2FA({
                otp: otp.toString(),
                geo: labels.location,
                device: labels.device,
                ip: labels.ip ?? undefined,
                res,
                req,
            });
        } catch (error) {
            if (
                error instanceof AppError &&
                error.statusCode === statusCodes.BAD_REQUEST
            ) {
                logMaskedSecurityEvent(SECURITY_EVENTS.SIGNIN_FAILED, req, {
                    stage: '2fa',
                    reason: error.message.toLowerCase().includes('otp')
                        ? 'invalid_otp'
                        : 'invalid_2fa_session',
                });
            }
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

    signOutController(req: Request, res: Response, next: NextFunction) {
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
                decode = TokenBoot.verifyToken<TokenPayload>(
                    refreshToken,
                    'refresh'
                );
            } catch (error) {
                // Routine expiry is not a security signal — sessions age out
                // all the time. Everything else (forged signature, malformed
                // token) is logged before the request is rejected.
                if (!(
                    error instanceof AppError &&
                    error.message === 'Token has expired'
                )) {
                    logSecurityEvent(SECURITY_EVENTS.TOKEN_INVALID, req, {
                        stage: 'refresh',
                        reason:
                            error instanceof AppError
                                ? error.message
                                      .toLowerCase()
                                      .replace(/\s+/g, '_')
                                : 'unknown',
                    });
                }
                throw error;
            }
            if (!decode?.userId || !decode?.email) {
                logSecurityEvent(SECURITY_EVENTS.TOKEN_INVALID, req, {
                    stage: 'refresh',
                    reason: 'missing_claims',
                });
                throw AppError.Unauthorized('Invalid refresh token');
            }

            const { newAccessToken, newRefreshToken } =
                await AuthServiceBoot.refreshTokenService({
                    userId: decode.userId,
                    email: decode.email,
                    tokenIssuedAt: decode.iat,
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
                profile,
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
                profile,
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

            logSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGED, req, {
                userId,
            });

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
                    // A corrupt cache cookie is a client-side problem, not a
                    // server fault: drop it and fall through to a live check.
                    cacheLogger.warn('email_check_cache_cookie_unparseable', {
                        event: 'CACHE_COOKIE_INVALID',
                        reason: error instanceof Error ? error.name : 'unknown',
                    });
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
