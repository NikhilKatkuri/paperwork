import type { NextFunction, Request, Response } from 'express';

import config from '@/config';
import { captureNetworkInfo } from '@/utils/requestMeta';
import {
    isClientError,
    logSecurityEvent,
    SECURITY_EVENTS,
    suspiciousPayloadDetector,
} from '@/utils/securityAudit';

/**
 * Catches rejected requests that no other module claimed responsibility for.
 *
 * `protect` logs its own 401s, `validateDomain` logs blocked signups, and the
 * rate limiters log throttling. What is left is the long tail — zod validation
 * failures, mongoose `CastError`s, bodies `express.json()` refused to parse —
 * which is where a probing client actually shows up. This watches the status
 * code on response completion and escalates only once a single client crosses
 * the threshold, so an ordinary validation error stays quiet.
 *
 * Mounted before the body parsers and the router so that even a request
 * rejected at the parser layer is observed.
 */
const securityAudit = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let settled = false;

    const inspect = (): void => {
        // `finish` and `close` can both fire; only judge the request once.
        if (settled) return;
        settled = true;

        if (!isClientError(res.statusCode)) return;

        const { ip } = captureNetworkInfo(req);
        const burst = suspiciousPayloadDetector.record(ip);
        if (burst === undefined) return;

        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_PAYLOAD, req, {
            statusCode: res.statusCode,
            burstSize: burst,
            threshold: config.logger.suspiciousPayloadThreshold,
            windowMs: config.logger.suspiciousPayloadWindowMs,
            reason: 'repeated_client_errors',
        });
    };

    // `close` covers aborted requests, where `finish` never fires: a client
    // that hangs up mid-upload is as interesting as one that receives a 400.
    res.once('finish', inspect);
    res.once('close', inspect);

    next();
};

export default securityAudit;
