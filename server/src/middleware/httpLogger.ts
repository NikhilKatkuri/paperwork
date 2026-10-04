import type { Request, Response } from 'express';

import morgan from 'morgan';

import config from '@/config';
import { httpLogger } from '@/utils/logger';
import {
    captureRequestMeta,
    captureResponseMeta,
    isNoisyPath,
} from '@/utils/requestMeta';

/** Lifecycle event names, shared with the log dashboards. */
export const HTTP_EVENTS = {
    REQUEST_RECEIVED: 'HTTP_REQUEST_RECEIVED',
    REQUEST_COMPLETED: 'HTTP_REQUEST_COMPLETED',
} as const;

/**
 * Morgan owns the request lifecycle and winston owns the output. The format
 * functions below hand structured metadata straight to the logger instead of
 * returning a rendered string, so access log lines stay machine-parseable
 * rather than becoming one opaque line of Apache-style text.
 *
 * Both formatters return a falsy line, which tells morgan not to write
 * anything to its own stream — that is why `discard` is passed rather than
 * leaving morgan on its default of `process.stdout`, which would interleave
 * unparseable text with the JSON output.
 */
const discard: morgan.StreamOptions = {
    write: () => {
        // Intentionally empty: winston is the only writer.
    },
};

/** Start time is shared so both access lines and the audit agree on it. */
const STARTED_AT = 'logStartedAt';

const startedAt = (res: Response): number | undefined => {
    const value = res.locals[STARTED_AT];
    return typeof value === 'number' ? value : undefined;
};

/** Status classes decide whether a completed request is routine or notable. */
const levelForStatus = (statusCode: number): 'info' | 'warn' | 'error' => {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
};

const shouldLog = (req: Request): boolean => {
    if (isNoisyPath(req.path)) return false;
    if (!config.logger.logPreflight && req.method === 'OPTIONS') return false;
    return true;
};

/**
 * `HTTP_REQUEST_RECEIVED`, emitted the moment the request enters the stack.
 *
 * This line exists so a request that crashes the process or hangs forever is
 * still on record. It deliberately carries no body: `express.json()` has not
 * run yet, so there would be nothing to log, and duplicating the payload
 * across two lines per request doubles log volume for no gain. `route` and
 * `userId` are likewise unavailable — routing and authentication come later.
 */
export const requestReceived = morgan<Request, Response>(
    (_tokens, req, res) => {
        if (!shouldLog(req)) return undefined;

        res.locals[STARTED_AT] = Date.now();

        httpLogger.info('http.request_received', {
            event: HTTP_EVENTS.REQUEST_RECEIVED,
            ...captureRequestMeta(req, { includeBody: false }),
        });

        return undefined;
    },
    { stream: discard, immediate: true }
);

/**
 * `HTTP_REQUEST_COMPLETED`, emitted when the response finishes or the
 * connection closes. Carries the status code, duration, response size, the
 * matched route pattern, the authenticated user, and — because it runs after
 * the body parser — the redacted request body.
 *
 * Registered ahead of the router so it also observes requests the limiter or
 * a body parser rejected.
 */
export const requestCompleted = morgan<Request, Response>(
    (_tokens, req, res) => {
        if (!shouldLog(req)) return undefined;

        const request = captureRequestMeta(req, { includeBody: true });
        const response = captureResponseMeta(res, startedAt(res));
        const level = levelForStatus(response.statusCode);

        httpLogger[level]('http.request_completed', {
            event: HTTP_EVENTS.REQUEST_COMPLETED,
            requestId: req.id,
            method: request.method,
            path: request.path,
            url: request.url,
            route: request.route,
            routeParams: request.routeParams,
            query: request.query,
            body: request.body,
            bodyOmitted: request.bodyOmitted,
            userId: request.userId,
            ip: request.ip,
            forwardedFor: request.forwardedFor,
            userAgent: request.userAgent,
            // True when the client hung up before the response completed.
            aborted: !res.writableEnded,
            ...response,
        });

        return undefined;
    },
    { stream: discard }
);
