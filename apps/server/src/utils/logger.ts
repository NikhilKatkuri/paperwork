import { AsyncLocalStorage } from 'node:async_hooks';

import winston from 'winston';

import config from '@/config';
import { sanitizeError } from '@/utils/sanitize';

/**
 * Per-request correlation id, propagated through `async_hooks`.
 *
 * `src/middleware/requestId.ts` opens a scope with `runWithRequestContext`, so
 * every `logger.info(...)` downstream — inside services, repositories, redis
 * helpers, BullMQ workers — is tagged with the active request id without any
 * function having to accept or forward one.
 *
 * This is the *only* mutable request-scoped state in the process. It is not a
 * substitute for `req.id`, which stays authoritative on the HTTP layer (see
 * `src/utils/requestMeta.ts`): a `finish` listener is not guaranteed to run
 * inside the scope that registered it.
 */
const requestContextStore = new AsyncLocalStorage<string>();

/** The request id bound to the current async execution scope, if any. */
export const getRequestId = (): string | undefined =>
    requestContextStore.getStore();

/**
 * Runs `callback` inside a request scope. Async continuations started within
 * `callback` inherit the id, which is what makes deep service-layer logs
 * correlatable back to the HTTP call that triggered them.
 */
export const runWithRequestContext = <T>(
    requestId: string,
    callback: () => T
): T => requestContextStore.run(requestId, callback);

/**
 * Copies the ambient request id onto the record unless the caller already
 * supplied one. Applied as a winston format so it holds for every logger
 * derived from `logger`, including child loggers.
 */
const withRequestId = winston.format((info) => {
    if (!info.requestId) {
        const requestId = getRequestId();
        if (requestId) info.requestId = requestId;
    }
    return info;
});

/**
 * Extra colour slots registered on logform's shared Colorizer.
 *
 * `Colorizer.colorize(lookup, ...)` resolves `lookup` through a slot table,
 * not a raw colour name: the npm level names are pre-registered by winston,
 * and anything else has to be added explicitly or the lookup returns
 * `undefined` and throws.
 */
const DEV_COLORS = {
    dim: 'gray',
    requestId: 'magenta',
    event: 'cyan',
    service: 'blue',
} as const;

/** Keys rendered explicitly by the dev formatter, not dumped as payload. */
const RESERVED_FIELDS: ReadonlySet<string> = new Set([
    'level',
    'message',
    'timestamp',
    'event',
    'requestId',
    'service',
]);

const colorizer = winston.format.colorize({ level: true });
colorizer.addColors(DEV_COLORS);

/**
 * Paints `text` using a registered slot. Never throws: an unregistered slot
 * would raise inside logform, and a rendering failure must not take down the
 * request that happened to be logging.
 */
const paint = (slot: string, text: string): string => {
    try {
        return colorizer.colorize(slot, text);
    } catch {
        return text;
    }
};

const safeStringify = (value: unknown): string => {
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
};

/**
 * Single-line human readable output for local development: timestamp, level,
 * service, event, message, request id, then the remaining payload.
 *
 * The raw level is read from the `LEVEL` symbol because `colorize` has
 * already wrapped `info.level` in ANSI codes by this point.
 */
const developmentFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    withRequestId(),
    colorizer,
    winston.format.printf((info) => {
        const level = String(info[Symbol.for('level')] ?? info.level);
        const parts: string[] = [
            paint('dim', String(info.timestamp ?? '')),
            paint(level, level.toUpperCase()),
        ];

        if (info.service) parts.push(paint('service', `[${info.service}]`));
        if (info.event) parts.push(paint('event', String(info.event)));
        parts.push(String(info.message ?? ''));
        if (info.requestId)
            parts.push(paint('requestId', String(info.requestId)));

        const payload: Record<string, unknown> = {};
        for (const key of Object.keys(info)) {
            if (RESERVED_FIELDS.has(key)) continue;
            const value = info[key];
            if (value === undefined) continue;
            payload[key] = value;
        }

        if (Object.keys(payload).length > 0) {
            parts.push(paint('dim', safeStringify(payload)));
        }

        return parts.join(' ');
    })
);

/**
 * One JSON object per line for production, ready for stdout scraping. No
 * `colorize` here, so no ANSI escapes ever reach a log shipper.
 */
const productionFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    withRequestId(),
    winston.format.json()
);

const isProduction = config.env === 'production';

export const logger = winston.createLogger({
    level: config.logger.level,
    format: isProduction ? productionFormat : developmentFormat,
    transports: [
        new winston.transports.Console({
            // Keep alert-worthy output on stderr so a container runtime can
            // split it from routine traffic on stdout.
            stderrLevels: isProduction ? ['error'] : [],
        }),
    ],
    // A logging failure must never take the process down.
    handleExceptions: false,
    handleRejections: false,
    exitOnError: false,
});

/** Child loggers stamp a `service` tag so queries can filter by subsystem. */
export const createServiceLogger = (service: string): winston.Logger =>
    logger.child({ service });

export const httpLogger = createServiceLogger('http');
export const securityLogger = createServiceLogger('security');
export const dbLogger = createServiceLogger('db');
export const queueLogger = createServiceLogger('queue');
export const workerLogger = createServiceLogger('worker');
export const mailLogger = createServiceLogger('mail');
export const cacheLogger = createServiceLogger('cache');

/**
 * Logs an `unknown` throwable with its stack and triage fields preserved.
 * Prefer this over `log.error(msg, err)`, which winston flattens to `{}`.
 */
export const logError = (
    log: winston.Logger,
    message: string,
    error: unknown,
    meta: Record<string, unknown> = {}
): void => {
    log.error(message, { ...meta, error: sanitizeError(error) });
};

/**
 * Process-level failure. Wired to `uncaughtException` and
 * `unhandledRejection` in `server.ts` so a crash leaves a structured record
 * with its stack instead of a bare console line nobody is watching.
 */
export const fatal = (message: string, error?: unknown): void => {
    if (error === undefined) {
        logger.error(message, { event: 'PROCESS_FATAL' });
        return;
    }

    logError(logger, message, error, { event: 'PROCESS_FATAL' });
};
