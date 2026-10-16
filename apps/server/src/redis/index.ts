import Redis from 'ioredis';
import config from '@/config';

const cacheRedis = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

const redisConnection = {
    url: config.redis.url,
    skipEvictionCheck: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

// Lazy to break the Trend <-> index import cycle (Trend previously captured
// an uninitialised `cacheRedis` and crashed on first use).
const trendEngine: any = (() => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Trend = require('@/redis/trend').default;
        return new Trend(cacheRedis);
    } catch {
        return null;
    }
})();

cacheRedis.on('error', () => undefined);

export { trendEngine, cacheRedis, redisConnection };
