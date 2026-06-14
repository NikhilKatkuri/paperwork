import ratelimit, {
    type Options,
    type RateLimitRequestHandler,
} from 'express-rate-limit';
import status from 'http-status-codes';
 
const base: Partial<Options> = {
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message: 'Too many requests, please try again later.',
    }, 
};

 
const limiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 100,
});

 
const lowLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 30,
});
 
const authLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message:
            'Too many authentication attempts. Please try again in 15 minutes.',
    },
});
 
const forgotPasswordLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 3,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message:
            'Too many recovery requests. Please check your inbox or try again later.',
    },
});

 
const profileGetterLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 150,
});
 
const refreshTokenLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message:
            'Abnormal token rotation detected. Please authenticate manually.',
    },
});

 
const createFormsLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message:
            'Form generation limit exceeded. Please modify existing configurations.',
    },
});

 
const createFormsInnerLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 400, 
    message: {
        status: status.TOO_MANY_REQUESTS,
        message:
            'Batch modification rate warning. Please pause before saving additional changes.',
    },
});

export {
    limiter,
    authLimiter,
    forgotPasswordLimiter,
    profileGetterLimiter,
    refreshTokenLimiter,
    createFormsLimiter,
    createFormsInnerLimiter,
    lowLimiter,
};
