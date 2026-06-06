import Trend from '@/redis/trend';
import Redis from 'ioredis';
import config from '@/config';

const cacheRedis = new Redis({
    host: config.redis.host,
    port: Number(config.redis.port),
    maxRetriesPerRequest: 3,
    db: 1,
});

const redisConnection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
};

const trendEngine = new Trend();
export { trendEngine, cacheRedis, redisConnection };
