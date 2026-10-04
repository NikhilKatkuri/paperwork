import type { Request, Response } from 'express';

import config from '@/config';
import { getRequestId } from '@/utils/logger';
import { sanitize, truncate } from '@/utils/sanitize';

/**
 * `X-Request-ID` is the correlation header we advertise to clients and read
 * from upstream proxies.
 */
export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Paths that are machine-to-machine noise on every scrape. They stay
 * reachable but are excluded from the access log by default.
 */
const NOISY_PATHS: ReadonlySet<string> = new Set([
    '/health',
    '/healthz',
    '/ready',
    '/live',
    '/ping',
    '/favicon.ico',
]);

/**
 * Body keys that must never reach a log sink. `sanitize` also redacts
 * anything password/token/secret-shaped; this list exists to document the
 * fields this API specifically cares about and to keep them redacted even if
 * the generic matcher is ever relaxed.
 */
const NEVER_LOG_BODY_KEYS: ReadonlySet<string> = new Set([
    'password',
    'confirmPassword',
    'token',
    'refreshToken',
    'accessToken',
    'resetToken',
    'otp',
    'secret',
    'cardNumber',
    'cvv',
]);

/**
 * Path segments whose *following* segment is a credential. `/reset-password`
 * and `/2fa` put a live token in the URL, so access logging the raw path
 * would be a credential leak.
 */
const SECRET_PATH_SEGMENTS: ReadonlySet<string> = new Set([
    'reset-password',
    '2fa',
    'verify-email',
]);

const IPV4_MAPPED_PREFIX = '::ffff:';

export interface NetworkInfo {
    /**
     * The address attributed to the client. Derived from `req.ip`, which
     * already honours the app's `trust proxy` setting.
     */
    ip: string | undefined;
    /** Raw `X-Forwarded-For`, recorded for reference but never trusted. */
    forwardedFor: string | undefined;
    /** Whether Express was configured to trust proxy headers. */
    proxyTrusted: boolean;
    /** Whether the connection is an encrypted one, per `trust proxy`. */
    secure: boolean | undefined;
}

/**
 * Normalizes IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`) so that a client
 * appears as one stable value regardless of the socket family.
 */
export const normalizeIp = (
    address: string | null | undefined
): string | undefined => {
    if (!address) return undefined;
    const trimmed = address.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith(IPV4_MAPPED_PREFIX)
        ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
        : trimmed;
};

/**
 * Extracts client network information.
 *
 * `req.ip` is the only value safe to attribute to a client: it is derived
 * from `X-Forwarded-For` only as far as the `trust proxy` setting allows.
 * In production `app.ts` enables `trust proxy`, which trusts the whole chain,
 * so deployments **must** terminate TLS at a proxy that overwrites
 * `X-Forwarded-For` — otherwise a client can spoof its own address. The raw
 * header is still logged so a spoofing attempt is visible after the fact.
 */
export const captureNetworkInfo = (req: Request): NetworkInfo => {
    const trustProxy = req.app.get('trust proxy');
    const header = req.headers['x-forwarded-for'];

    return {
        ip: normalizeIp(req.ip) ?? normalizeIp(req.socket?.remoteAddress),
        forwardedFor: truncate(
            Array.isArray(header) ? header.join(', ') : (header ?? ''),
            512
        ),
        proxyTrusted: Boolean(trustProxy),
        secure: req.secure,
    };
};

/**
 * Replaces credential-bearing path segments with a placeholder. Logs the
 * route shape rather than the secret.
 *
 * Applies to both `path` and `url`: `POST /auth/reset-password/:token` and
 * `POST /auth/sign-in/2fa/:otp` put live credentials in the request target,
 * so logging the raw URL would be a credential leak in the log store.
 */
export const scrubPath = (path: string): string => {
    if (!path) return path;

    const segments = path.split('/');
    const scrubbed = segments.map((segment, index) => {
        const previous = segments[index - 1]?.toLowerCase();
        // Already a substituted route parameter (`:token`), so there is no
        // secret left to redact.
        if (segment.startsWith(':')) return segment;
        if (previous && SECRET_PATH_SEGMENTS.has(previous)) return '[redacted]';
        return segment;
    });

    return truncate(scrubbed.join('/'));
};

/**
 * Scrubs a full request target, preserving the query string.
 *
 * Query values are redacted by `sanitize` when they land in the `query`
 * field; here only the path needs attention, so the query is passed through
 * untouched and left to that redaction.
 */
export const scrubUrl = (url: string): string => {
    if (!url) return url;

    const queryAt = url.indexOf('?');
    if (queryAt === -1) return scrubPath(url);

    return `${scrubPath(url.slice(0, queryAt))}${url.slice(queryAt)}`;
};

export interface RequestMeta {
    requestId: string | undefined;
    method: string;
    /** Path only, with credentials scrubbed. */
    path: string;
    /** Raw request target with credentials scrubbed, query preserved. */
    url: string;
    route: string | undefined;
    routeParams: Record<string, string>;
    query: Record<string, unknown>;
    ip: string | undefined;
    forwardedFor: string | undefined;
    secure: boolean | undefined;
    userAgent: string | undefined;
    referrer: string | undefined;
    contentType: string | undefined;
    contentLength: string | undefined;
    /** Present only once `protect` has run. */
    userId: string | undefined;
    /** Redacted body. Omitted entirely when body logging is disabled. */
    body?: unknown;
    /**
     * True when a body was expected but is not present on this line: either
     * the environment disables body logging, or the line was emitted before
     * the body parser ran. Lets a reviewer tell the two apart from an
     * genuinely empty body.
     */
    bodyOmitted: boolean;
    /** True when the body has not been parsed yet at the time of logging. */
    bodyUnparsed: boolean;
}

/**
 * Assembles the structured metadata for an access log line.
 *
 * Body logging is the intersection of two gates: the caller must ask for it
 * (`options.includeBody`), and the environment must allow it
 * (`config.logger.requestBody`, on by default only in development). A caller
 * asking for a body can therefore never override the production policy.
 *
 * `bodyOmitted` / `bodyUnparsed` distinguish "withheld by policy" from "not
 * parsed yet" from a genuinely empty body.
 */
const DEFAULT_SANITIZE_CONTEXT: { includeBody: boolean } = {
    includeBody: false,
};
export const captureRequestMeta = (
    req: Request,
    options = DEFAULT_SANITIZE_CONTEXT
): RequestMeta => {
    const network = captureNetworkInfo(req);
    const headers = req.headers;
    const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    // A line emitted before `express.json()` has run sees no body at all,
    // which is different from a body that the policy withheld.
    const bodyUnparsed = hasBody && req.body === undefined;
    const includeBody =
        options.includeBody &&
        config.logger.requestBody &&
        hasBody &&
        !bodyUnparsed;
    const body =
        includeBody && typeof req.body === 'object' && req.body !== null
            ? sanitize(stripNeverLogKeys(req.body))
            : undefined;

    // `req.path` is relative to the current router mount, so a limiter or
    // controller mounted under `authRouter` would log `/sign-in` rather than
    // `/api/v1/auth/sign-in`. `originalUrl` is always absolute, which makes
    // `path` comparable across every middleware in the stack.
    const absoluteUrl = req.originalUrl || req.url || '';
    const absolutePath = absoluteUrl.split('?')[0] ?? absoluteUrl;

    const headerValue = (name: string): string | undefined => {
        const value = headers[name];
        if (value === undefined) return undefined;
        return truncate(Array.isArray(value) ? value.join(', ') : value, 512);
    };

    return {
        // `req.id` is authoritative; the async store is only a fallback for
        // log lines emitted outside the request scope (e.g. socket callbacks).
        requestId: req.id ?? getRequestId(),
        method: req.method,
        path: scrubPath(absolutePath),
        url: scrubUrl(absoluteUrl),
        route: resolveRoute(req),
        routeParams: sanitize(req.params ?? {}) as Record<string, string>,
        query: (sanitize(req.query ?? {}) ?? {}) as Record<string, unknown>,
        ip: network.ip,
        forwardedFor: network.forwardedFor || undefined,
        secure: network.secure,
        userAgent: headerValue('user-agent'),
        referrer: headerValue('referer'),
        contentType: headerValue('content-type'),
        contentLength: headerValue('content-length'),
        userId: req.user?.id,
        bodyOmitted: hasBody && !includeBody,
        bodyUnparsed,
        ...(body !== undefined ? { body } : {}),
    };
};

export interface ResponseMeta {
    statusCode: number;
    /** Wall-clock duration in milliseconds, rounded to 2 decimals. */
    responseTimeMs: number | undefined;
    contentLength: string | undefined;
}

/**
 * Assembles the response half of an access log line.
 *
 * `contentLength` comes from the response rather than the request so that a
 * truncated or aborted body is still visible in the log.
 */
export const captureResponseMeta = (
    res: Response,
    startedAt: number | undefined
): ResponseMeta => {
    const length = res.getHeader('content-length');

    return {
        statusCode: res.statusCode,
        responseTimeMs:
            startedAt === undefined
                ? undefined
                : Math.round((Date.now() - startedAt) * 100) / 100,
        contentLength:
            length === undefined ? undefined : truncate(String(length), 64),
    };
};

/**
 * The matched route pattern, e.g. `/api/v1/forms/:formId`.
 *
 * Derived by substituting `req.params` values back into the request path
 * rather than from `req.route` + `req.baseUrl`: Express restores `baseUrl`
 * once a router layer exits, so by the time a `finish` listener runs,
 * `req.baseUrl` is back to `''` and `req.route.path` yields a truncated
 * `/sign-up` instead of `/api/v1/auth/sign-up`. Substituting params also
 * redacts credential-bearing path segments for free.
 *
 * Returns `undefined` only when there is no usable path.
 */

const getRequestPath = (req: Request): string | undefined => {
    const original = req.originalUrl || req.url;
    if (!original) return undefined;

    return original.split('?')[0] ?? original;
};

const substituteParams = (
    path: string,
    params: Record<string, unknown>
): string => {
    let route = path;

    for (const [key, value] of Object.entries(params)) {
        if (typeof value !== 'string' || value.length === 0) continue;

        const index = route.lastIndexOf(value);
        if (index === -1) continue;

        route = `${route.slice(0, index)}:${key}${route.slice(
            index + value.length
        )}`;
    }

    return route;
};

const getParamSegments = (routePath: unknown): string[] => {
    if (typeof routePath !== 'string') return [];

    return routePath.split('/').filter((segment) => segment.startsWith(':'));
};

const alignRouteParams = (path: string, paramSegments: string[]): string => {
    if (paramSegments.length === 0) return path;

    const segments = path.split('/');

    for (let i = 0; i < paramSegments.length; i++) {
        const from = paramSegments.length - 1 - i;
        const to = segments.length - 1 - i;
        const replacement = paramSegments[from];

        if (to < 1 || replacement === undefined) break;

        segments[to] = replacement;
    }

    return segments.join('/');
};

const resolveFromRoute = (req: Request, path: string): string => {
    const routePath = (req.route as { path?: unknown } | undefined)?.path;
    const paramSegments = getParamSegments(routePath);

    return alignRouteParams(path, paramSegments);
};

export const resolveRoute = (req: Request): string | undefined => {
    const path = getRequestPath(req);
    if (!path) return undefined;

    const params = req.params ?? {};

    const route =
        Object.keys(params).length > 0
            ? substituteParams(path, params)
            : resolveFromRoute(req, path);

    return scrubPath(truncate(route));
};

/**
 * Recursively removes the never-log body keys. `sanitize` performs the actual
 * redaction on write; this makes the intent explicit at the call site and
 * keeps the guarantee if `sanitize`'s heuristics are ever changed.
 */
const stripNeverLogKeys = (input: unknown, depth = 0): unknown => {
    if (depth > 6 || input === null || typeof input !== 'object') return input;
    if (Array.isArray(input)) {
        return input.map((item) => stripNeverLogKeys(item, depth + 1));
    }

    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
        input as Record<string, unknown>
    )) {
        output[key] = NEVER_LOG_BODY_KEYS.has(key)
            ? '[redacted]'
            : stripNeverLogKeys(value, depth + 1);
    }
    return output;
};

/** True when the path is excluded from access logging by policy. */
export const isNoisyPath = (path: string): boolean => NOISY_PATHS.has(path);
