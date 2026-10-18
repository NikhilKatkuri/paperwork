import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import config from '@/config';
import { AppError } from '@/utils/AppError';
import {
    classifyTokenError,
    logSecurityEvent,
    SECURITY_EVENTS,
} from '@/utils/securityAudit';

/**
 * Verifies the bearer access token and populates `req.user`.
 *
 * Every rejection path emits a security event. The token itself is never
 * logged — only the failure classification — so the audit trail stays useful
 * without becoming a credential store.
 */
const protect = (req: Request, _res: Response, next: NextFunction): void => {
    const authorizationHeader = req.headers.authorization;

    if (
        !authorizationHeader ||
        !authorizationHeader.toLowerCase().startsWith('bearer ')
    ) {
        logSecurityEvent(SECURITY_EVENTS.UNAUTHENTICATED, req, {
            reason: authorizationHeader ? 'malformed_header' : 'missing_header',
        });
        next(AppError.Unauthorized('unauthorized'));
        return;
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        logSecurityEvent(SECURITY_EVENTS.UNAUTHENTICATED, req, {
            reason: 'empty_token',
        });
        next(AppError.Unauthorized('unauthorized'));
        return;
    }

    try {
        const decodedToken = jwt.verify(token, config.jwt.secret, {
            algorithms: ['HS256'],
        }) as JwtPayload & { userId?: string; email?: string };

        if (!decodedToken?.userId) {
            logSecurityEvent(SECURITY_EVENTS.TOKEN_INVALID, req, {
                reason: 'missing_subject',
            });
            next(AppError.Unauthorized('unauthorized'));
            return;
        }

        req.user = {
            id: decodedToken.userId,
            email: decodedToken.email ?? '',
        };
        next();
    } catch (error) {
        const { event, reason } = classifyTokenError(error);

        logSecurityEvent(event, req, {
            reason,
            // `exp` is safe to record and makes expiry triage trivial.
            expiresAt:
                error instanceof jwt.TokenExpiredError
                    ? new Date(error.expiredAt).toISOString()
                    : undefined,
        });

        next(AppError.Unauthorized('unauthorized'));
    }
};

export default protect;
