import Trend from '@/redis/trend';
import Redis from 'ioredis';
import config from '@/config';

const cacheRedis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
});

const redisConnection = {
    url: config.redis.url,
    skipEvictionCheck: true,
};

const trendEngine = new Trend();
export { trendEngine, cacheRedis, redisConnection };
