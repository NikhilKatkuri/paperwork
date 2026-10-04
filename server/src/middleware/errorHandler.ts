import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import config from '@/config';
import { AppError } from '@/utils/AppError';
import { logError, logger } from '@/utils/logger';
import { normalizeIp, resolveRoute, scrubUrl } from '@/utils/requestMeta';
import { sanitizeError } from '@/utils/sanitize';

interface NormalizedError {
    statusCode: number;
    message: string;
    /** Field-level detail, returned to the client as-is. */
    errors?: unknown;
    /** True when the failure was a client mistake rather than a server fault. */
    operational: boolean;
}

interface ErrorShape {
    name?: string;
    message?: string;
    type?: string;
    statusCode?: number;
    code?: number | string;
    keyValue?: unknown;
    errors?: unknown;
    path?: string;
}

const JWT_ERROR_NAMES = new Set([
    'JsonWebTokenError',
    'TokenExpiredError',
    'NotBeforeError',
]);

/**
 * Maps a throwable onto a status code and a client-safe message.
 *
 * Previously only `AppError` and mongoose `CastError` were recognised, so
 * every zod failure, duplicate-key write and malformed JWT fell through to a
 * 500 and dumped a raw stack into the log. Each case below now produces the
 * status it actually deserves, and the distinction between a rejected request
 * and a genuine fault is preserved for alerting.
 */
const normalizeError = (error: unknown): NormalizedError => {
    if (error instanceof AppError) {
        const normalized: NormalizedError = {
            statusCode: error.statusCode,
            message: error.message,
            operational: true,
        };

        if ('errors' in error) {
            normalized.errors = (error as { errors?: unknown }).errors;
        }

        return normalized;
    }

    const candidate = (error ?? {}) as ErrorShape;
    const name = candidate.name ?? '';

    // zod, when a schema is parsed outside the `validate` middleware.
    if (name === 'ZodError') {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'Validation failed',
            errors: candidate.errors,
            operational: true,
        };
    }

    // mongoose schema validation.
    if (name === 'ValidationError') {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            message: candidate.message ?? 'Document validation failed',
            operational: true,
        };
    }

    // Unique index violation.
    if (candidate.code === 11000) {
        return {
            statusCode: StatusCodes.CONFLICT,
            message: 'Resource already exists',
            errors: candidate.keyValue,
            operational: true,
        };
    }

    // Malformed ObjectId in a path or query parameter.
    if (name === 'CastError') {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            message: `Invalid format for field: ${candidate.path ?? 'unknown'}`,
            operational: true,
        };
    }

    // Malformed or unverifiable JWT outside `protect`.
    if (JWT_ERROR_NAMES.has(name)) {
        return {
            statusCode: StatusCodes.UNAUTHORIZED,
            message: 'unauthorized',
            operational: true,
        };
    }

    // `express.json()` refusing a malformed body.
    if (
        name === 'SyntaxError' &&
        (candidate.message?.includes('JSON') ?? false)
    ) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'Malformed JSON payload',
            operational: true,
        };
    }

    // Body larger than the `express.json` limit.
    if (candidate.type === 'entity.too.large') {
        return {
            statusCode: StatusCodes.REQUEST_TOO_LONG,
            message: 'Request body too large',
            operational: true,
        };
    }

    return {
        statusCode:
            typeof candidate.statusCode === 'number'
                ? candidate.statusCode
                : StatusCodes.INTERNAL_SERVER_ERROR,
        message: candidate.message
            ? candidate.message
            : 'Internal Server Error',
        operational: false,
    };
};

/**
 * Terminal error handler.
 *
 * Every failure is logged with the originating `requestId` and full request
 * attribution, then answered with a consistent envelope. `requestId` is echoed
 * in the body so a user can quote it in a support request and it can be
 * matched straight back to these logs.
 */
const globalErrorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // A stream failure or a client timeout may already have flushed headers.
    // Writing again would throw ERR_HTTP_HEADERS_SENT and bury the real fault.
    if (res.headersSent) {
        next(error);
        return;
    }

    const normalized = normalizeError(error);

    const meta = {
        requestId: req.id,
        method: req.method,
        path: scrubUrl(req.originalUrl || req.url),
        route: resolveRoute(req),
        statusCode: normalized.statusCode,
        userId: req.user?.id,
        ip: normalizeIp(req.ip) ?? normalizeIp(req.socket?.remoteAddress),
        operational: normalized.operational,
    };

    if (normalized.operational) {
        // A rejected request is worth surfacing, not worth paging anyone.
        // Deliberately no stack: an expired token produces a 15-frame trace
        // that says nothing, and burying real faults under them is how
        // alerting ends up ignored. The security audit already recorded why
        // the request was refused.
        logger.warn(`${normalized.statusCode} ${normalized.message}`, {
            ...meta,
            event: 'HTTP_REQUEST_REJECTED',
            error: sanitizeError(error, undefined, { includeStack: false }),
        });
    } else {
        logError(logger, 'unhandled_error', error, {
            ...meta,
            event: 'HTTP_UNHANDLED_ERROR',
        });
    }

    res.status(normalized.statusCode).json({
        success: false,
        message: normalized.message,
        requestId: req.id,
        ...(normalized.errors !== undefined && { errors: normalized.errors }),
        ...(config.env === 'development' &&
            error instanceof Error &&
            error.stack && { stack: error.stack }),
    });
};

export default globalErrorHandler;
