import type { NextFunction, Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import { runWithRequestContext } from '@/utils/logger';
import { REQUEST_ID_HEADER } from '@/utils/requestMeta';

/**
 * Shape an inbound correlation id must have to be trusted.
 *
 * The id is attacker-controlled, and it is interpolated into log lines that
 * operators read in a terminal. Allowing arbitrary bytes would let a client
 * forge a correlation id to frame another actor, or inject newlines and ANSI
 * escapes to corrupt an audit trail. Anything that does not match is replaced
 * with a freshly generated UUIDv4.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._~+/=:@-]{8,128}$/;

/** True when `value` is safe to reuse as a correlation id. */
export const isValidRequestId = (value: unknown): value is string =>
    typeof value === 'string' && SAFE_REQUEST_ID.test(value);

/**
 * Reads `X-Request-ID` from the request, falling back to a new UUIDv4.
 *
 * A repeated header arrives as an array; the first value is used so that a
 * client sending duplicates cannot smuggle a second id past the check.
 */
export const resolveRequestId = (req: Request): string => {
    const raw = req.headers[REQUEST_ID_HEADER.toLowerCase()];
    const candidate = Array.isArray(raw) ? raw[0] : raw;

    return isValidRequestId(candidate) ? candidate : uuidv4();
};

/**
 * Assigns a correlation id to every request and opens the `AsyncLocalStorage`
 * scope for its whole lifetime.
 *
 * Registered as the very first middleware in `app.ts`, before `helmet`, `cors`
 * and the rate limiters, so that requests rejected by any of them are still
 * traceable. The id is echoed on the response so a client can quote it in a
 * bug report, and `cors.ts` exposes the header for browser callers.
 */
const requestId = (req: Request, res: Response, next: NextFunction): void => {
    const id = resolveRequestId(req);

    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);

    // Everything downstream — body parsers, controllers, services, redis and
    // queue helpers — now runs inside this scope, so any `logger.*` call picks
    // up the id automatically. `next` returns synchronously after the chain
    // settles; ALS keeps the id alive for the whole async continuation.
    runWithRequestContext(id, next);
};

export default requestId;
