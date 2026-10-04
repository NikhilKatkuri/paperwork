import type { Options } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import status from 'http-status-codes';

import config from '@/config';
import { logSecurityEvent, SECURITY_EVENTS } from '@/utils/securityAudit';

/**
 * Read through `@/config` rather than `process.env` directly. This module is
 * imported before `dotenv.config()` has necessarily run in every module graph,
 * so reading the env var here was order-dependent and could silently pick the
 * development branch in a deployed build.
 */
const isProd = config.env === 'production';

type LimiterPreset = {
    windowMs: number;
    limit: number;
    message?: string;
    /**
     * Distinguishes presets in the audit trail: throttling on the auth
     * limiter matters far more than throttling on a bulk-edit limiter.
     */
    severity?: 'low' | 'medium' | 'high';
};

const devMultiplier = 1000;

const scale = (value: number) => (isProd ? value : value * devMultiplier);

export const rateLimitConfig: Record<string, LimiterPreset> = {
    default: {
        windowMs: 15 * 60 * 1000,
        limit: scale(100),
        severity: 'low',
    },

    low: {
        windowMs: 15 * 60 * 1000,
        limit: scale(30),
        severity: 'low',
    },

    auth: {
        windowMs: 15 * 60 * 1000,
        limit: scale(5),
        message:
            'Too many authentication attempts. Please try again in 15 minutes.',
        severity: 'high',
    },

    forgotPassword: {
        windowMs: 15 * 60 * 1000,
        limit: scale(3),
        message:
            'Too many recovery requests. Please check your inbox or try again later.',
        severity: 'high',
    },

    profileGetter: {
        windowMs: 15 * 60 * 1000,
        limit: scale(150),
        severity: 'low',
    },

    refreshToken: {
        windowMs: 15 * 60 * 1000,
        limit: scale(10),
        message:
            'Abnormal token rotation detected. Please authenticate manually.',
        severity: 'high',
    },

    createForms: {
        windowMs: 15 * 60 * 1000,
        limit: scale(10),
        message:
            'Form generation limit exceeded. Please modify existing configurations.',
        severity: 'medium',
    },

    createFormsInner: {
        windowMs: 15 * 60 * 1000,
        limit: scale(400),
        message:
            'Batch modification rate warning. Please pause before saving additional changes.',
        severity: 'low',
    },

    action: {
        windowMs: 60 * 60 * 1000,
        limit: scale(10),
        message:
            'Action rate limit exceeded. Please slow down and try again later.',
        severity: 'medium',
    },
} satisfies Record<string, LimiterPreset>;

export const buildRateLimitMessage = (message?: string) => ({
    status: status.TOO_MANY_REQUESTS,
    message: message ?? 'Too many requests, please try again later.',
});

/**
 * Builds the `handler` for a limiter so every throttled request produces a
 * security event naming the preset that fired.
 *
 * Without this, `express-rate-limit` responds silently: repeated credential
 * stuffing against `/auth/sign-in` looks exactly like a quiet client. The
 * response body is left byte-identical to `buildRateLimitMessage` so the
 * public API contract does not change.
 */
export const buildRateLimitHandler =
    (key: ConfigKey, preset: LimiterPreset) =>
    (
        req: Request,
        res: Response,
        _next: NextFunction,
        options: Options
    ): void => {
        logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, req, {
            limiter: key,
            severity: preset.severity ?? 'medium',
            windowMs: options.windowMs ?? preset.windowMs,
            limit:
                typeof options.limit === 'number'
                    ? options.limit
                    : preset.limit,
        });

        res.status(status.TOO_MANY_REQUESTS).json(
            buildRateLimitMessage(preset.message)
        );
    };

export const baseRateLimitOptions: Partial<Options> = {
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
};

export type ConfigKey = keyof typeof rateLimitConfig;
