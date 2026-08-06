import type { Options } from 'express-rate-limit';
import status from 'http-status-codes';

const isProd = process.env.NODE_ENV === 'production';

type LimiterPreset = {
    windowMs: number;
    limit: number;
    message?: string;
};

const devMultiplier = 1000;

const scale = (value: number) => (isProd ? value : value * devMultiplier);

export const rateLimitConfig: Record<string, LimiterPreset> = {
    default: {
        windowMs: 15 * 60 * 1000,
        limit: scale(100),
    },

    low: {
        windowMs: 15 * 60 * 1000,
        limit: scale(30),
    },

    auth: {
        windowMs: 15 * 60 * 1000,
        limit: scale(5),
        message:
            'Too many authentication attempts. Please try again in 15 minutes.',
    },

    forgotPassword: {
        windowMs: 15 * 60 * 1000,
        limit: scale(3),
        message:
            'Too many recovery requests. Please check your inbox or try again later.',
    },

    profileGetter: {
        windowMs: 15 * 60 * 1000,
        limit: scale(150),
    },

    refreshToken: {
        windowMs: 15 * 60 * 1000,
        limit: scale(10),
        message:
            'Abnormal token rotation detected. Please authenticate manually.',
    },

    createForms: {
        windowMs: 15 * 60 * 1000,
        limit: scale(10),
        message:
            'Form generation limit exceeded. Please modify existing configurations.',
    },

    createFormsInner: {
        windowMs: 15 * 60 * 1000,
        limit: scale(400),
        message:
            'Batch modification rate warning. Please pause before saving additional changes.',
    },

    action: {
        windowMs: 60 * 60 * 1000,
        limit: scale(10),
        message:
            'Action rate limit exceeded. Please slow down and try again later.',
    },
} satisfies Record<string, LimiterPreset>;

export const baseRateLimitOptions: Partial<Options> = {
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
};

export const buildRateLimitMessage = (message?: string) => ({
    status: status.TOO_MANY_REQUESTS,
    message: message ?? 'Too many requests, please try again later.',
});

export type ConfigKey = keyof typeof rateLimitConfig;