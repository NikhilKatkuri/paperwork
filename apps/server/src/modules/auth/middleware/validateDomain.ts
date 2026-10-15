import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import domains from '@/data/disposable-domains.json';
import {
    logMaskedSecurityEvent,
    logSecurityEvent,
    SECURITY_EVENTS,
} from '@/utils/securityAudit';
import { maskEmail } from '@/utils/sanitize';

const disposableDomains = new Set<string>(domains);

/**
 * Rejects registrations against throwaway email providers.
 *
 * Both rejection paths emit a security event. Previously a blocked signup and
 * a successful one were indistinguishable in the logs, even though a burst of
 * blocked signups from one address is a strong fraud signal. The email is
 * masked, since a blocklist hit is exactly the case where the address itself
 * is not needed.
 */
function validateDomain(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const email = (req.body as { email?: unknown } | undefined)?.email;

    if (typeof email !== 'string' || !email.includes('@')) {
        logSecurityEvent(SECURITY_EVENTS.MALFORMED_PAYLOAD, req, {
            reason: 'missing_email',
            field: 'email',
            received: typeof email,
        });

        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'invalid domain',
        });
        return;
    }

    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
        logSecurityEvent(SECURITY_EVENTS.MALFORMED_PAYLOAD, req, {
            reason: 'unparseable_email',
            field: 'email',
        });

        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'invalid domain',
        });
        return;
    }

    if (disposableDomains.has(domain)) {
        logMaskedSecurityEvent(SECURITY_EVENTS.DISPOSABLE_EMAIL_BLOCKED, req, {
            domain,
            email: maskEmail(email),
        });

        res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'Invalid domain or disposable email',
        });
        return;
    }

    next();
}

export default validateDomain;
