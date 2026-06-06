import Trend from '@/redis/trend';
import Redis from 'ioredis';
import config from '@/config';

const cacheRedis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    db: 1,
});

const redisConnection = {
    url: config.redis.url,
};

const trendEngine = new Trend();
export { trendEngine, cacheRedis, redisConnection };
