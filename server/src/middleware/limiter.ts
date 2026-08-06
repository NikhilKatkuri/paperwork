import rateLimit, {
    type Options,
    type RateLimitRequestHandler,
} from 'express-rate-limit';

import {
    rateLimitConfig,
    baseRateLimitOptions,
    buildRateLimitMessage,
} from '@/config/rateLimit';

type ConfigKey = keyof typeof rateLimitConfig;

const createLimiter = (key: ConfigKey): RateLimitRequestHandler => {
    const config = rateLimitConfig[key];
    if (!config) {
        throw new Error(`Rate limit configuration for key "${key}" not found.`);
    }
    return rateLimit({
        ...baseRateLimitOptions,
        windowMs: config.windowMs,
        limit: config.limit,
        message: buildRateLimitMessage(config.message),
    } satisfies Partial<Options>);
};

export const limiter = createLimiter('default');
export const lowLimiter = createLimiter('low');
export const authLimiter = createLimiter('auth');
export const forgotPasswordLimiter = createLimiter('forgotPassword');
export const profileGetterLimiter = createLimiter('profileGetter');
export const refreshTokenLimiter = createLimiter('refreshToken');
export const createFormsLimiter = createLimiter('createForms');
export const createFormsInnerLimiter = createLimiter('createFormsInner');
export const actionLimiter = createLimiter('action');
