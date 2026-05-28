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
        message: 'too many requests, please try again later',
    },
};

const limiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 100,
});

const authLimiter: RateLimitRequestHandler = ratelimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 100,
    skipSuccessfulRequests: true,
    message: {
        status: status.TOO_MANY_REQUESTS,
        message: 'too many login attempts, please try again later',
    },
});

export { limiter, authLimiter };
