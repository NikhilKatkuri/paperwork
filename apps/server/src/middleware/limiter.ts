import rateLimit, {
    type Options,
    type RateLimitRequestHandler,
} from 'express-rate-limit';

import {
    baseRateLimitOptions,
    buildRateLimitHandler,
    buildRateLimitMessage,
    rateLimitConfig,
    type ConfigKey,
} from '@/config/rateLimit';

/**
 * Builds a limiter from a named preset.
 *
 * The preset key is captured here so the `handler` can attribute a throttle to
 * a specific limiter in the security audit trail — a 429 on `auth` means
 * something very different from one on `createFormsInner`.
 */
const createLimiter = (key: ConfigKey): RateLimitRequestHandler => {
    const config = rateLimitConfig[key];
    if (!config) {
        throw new Error(`Rate limit configuration for key "${key}" not found.`);
    }

    return rateLimit({
        ...baseRateLimitOptions,
        windowMs: config.windowMs,
        limit: config.limit,
        handler: buildRateLimitHandler(key, config),
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
