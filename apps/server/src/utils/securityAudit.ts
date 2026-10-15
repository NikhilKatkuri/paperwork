import type { Request } from 'express';

import config from '@/config';
import { securityLogger } from '@/utils/logger';
import { captureRequestMeta } from '@/utils/requestMeta';
import { maskIp } from '@/utils/sanitize';

/**
 * Canonical security event names.
 *
 * Emitted from the module that *made* the decision rather than inferred from
 * a status code afterwards, so each line carries the actual reason (which JWT
 * error, which domain, which limiter preset) instead of a bare `401`.
 */
export const SECURITY_EVENTS = {
    /** No `Authorization` header, or not a `Bearer` token. */
    UNAUTHENTICATED: 'SECURITY_UNAUTHENTICATED',
    /** Token present but unparseable, wrongly signed, or revoked. */
    TOKEN_INVALID: 'SECURITY_TOKEN_INVALID',
    /** Token parsed but past `exp` / before `nbf`. */
    TOKEN_EXPIRED: 'SECURITY_TOKEN_EXPIRED',
    /** A rate limiter rejected the request. */
    RATE_LIMIT_EXCEEDED: 'SECURITY_RATE_LIMIT_EXCEEDED',
    /** Repeated malformed / rejected payloads from one client. */
    SUSPICIOUS_PAYLOAD: 'SECURITY_SUSPICIOUS_PAYLOAD',
    /** A request that could not be parsed at all. */
    MALFORMED_PAYLOAD: 'SECURITY_MALFORMED_PAYLOAD',
    /** Registration attempt against a blacklisted disposable domain. */
    DISPOSABLE_EMAIL_BLOCKED: 'SECURITY_DISPOSABLE_EMAIL_BLOCKED',
} as const;

export type SecurityEvent =
    (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];

/**
 * Statuses fed to the burst detector.
 *
 * `401` and `403` are deliberately excluded: `protect` and `validateDomain`
 * already log those decisions at the source with the real reason, so counting
 * them here would escalate ordinary token expiry into a false "suspicious
 * payload" alarm. What remains is the anonymous long tail — malformed bodies,
 * failed validation, route probing — which is where a probing client lives.
 */
const CLIENT_ERROR_STATUSES: ReadonlySet<number> = new Set([
    400, // malformed body or failed validation
    404, // probing for routes that do not exist
    405, // wrong method against a real route
    422, // semantically invalid payload
]);

export const isClientError = (statusCode: number): boolean =>
    CLIENT_ERROR_STATUSES.has(statusCode);

/**
 * Records one security event with full request attribution.
 *
 * Bodies are deliberately excluded: a security line must never echo the
 * payload that was rejected, which is by definition untrusted input.
 */
export const logSecurityEvent = (
    event: SecurityEvent,
    req: Request,
    meta: Record<string, unknown> = {}
): void => {
    const request = captureRequestMeta(req);

    securityLogger.warn(`security: ${event}`, {
        ...request,
        event,
        ...meta,
    });
};

/**
 * Logs a security event with the client IP partially masked.
 *
 * Used where the operator only needs to distinguish one client from another
 * (blocked signups, throttling) rather than identify a specific network, which
 * keeps the log store from becoming a retention problem of its own.
 */
export const logMaskedSecurityEvent = (
    event: SecurityEvent,
    req: Request,
    meta: Record<string, unknown> = {}
): void => {
    const request = captureRequestMeta(req);

    securityLogger.warn(`security: ${event}`, {
        ...request,
        event,
        ip: request.ip ? maskIp(request.ip) : undefined,
        ...meta,
    });
};

/**
 * Sliding-window counter of rejected requests per client IP.
 *
 * A single `400` is routine — a typo in a form field. A burst of them from one
 * address is the signature of a fuzzer, a parameter-pollution probe, or an
 * attempt to slip a NoSQL/HTML payload past validation. This turns that
 * difference into an explicit signal instead of something an operator has to
 * notice by scrolling.
 *
 * Bounded on purpose: the map is swept whenever it reaches `maxClients`, so a
 * flood of spoofed source addresses cannot grow it without limit.
 */
export class SuspiciousPayloadDetector {
    private readonly hits = new Map<string, number[]>();

    constructor(
        private readonly threshold: number = config.logger
            .suspiciousPayloadThreshold,
        private readonly windowMs: number = config.logger
            .suspiciousPayloadWindowMs,
        private readonly maxClients = 10_000
    ) {}

    /**
     * Records a rejection and returns the current burst size once the
     * threshold is exceeded, or `undefined` while still within tolerance.
     */
    record(ip: string | undefined, now = Date.now()): number | undefined {
        if (!ip) return undefined;

        if (this.hits.size >= this.maxClients) this.sweep(now);

        const windowStart = now - this.windowMs;
        const recent = (this.hits.get(ip) ?? []).filter(
            (timestamp) => timestamp > windowStart
        );

        recent.push(now);
        this.hits.set(ip, recent);

        return recent.length > this.threshold ? recent.length : undefined;
    }

    /** Drops entries whose window has fully expired. */
    sweep(now = Date.now()): void {
        const windowStart = now - this.windowMs;

        for (const [ip, timestamps] of this.hits) {
            const recent = timestamps.filter(
                (timestamp) => timestamp > windowStart
            );
            if (recent.length === 0) this.hits.delete(ip);
            else this.hits.set(ip, recent);
        }
    }
}

/** Process-wide detector, shared by every request. */
export const suspiciousPayloadDetector = new SuspiciousPayloadDetector();
