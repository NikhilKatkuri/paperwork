import { cacheRedis } from '@/redis';
import { Redis } from 'ioredis';

interface CacheEntry {
    data: string;
    expireAt: number;
}

interface FormStats {
    count: number;
    mean: number;
    M2: number;
}

interface GlobalStats {
    count: number;
    mean: number;
    M2: number;
}

class Semaphore {
    private counter: number;
    private queue: (() => void)[] = [];

    constructor(max: number) {
        this.counter = max;
    }

    async acquire(): Promise<void> {
        if (this.counter > 0) {
            this.counter--;
            return;
        }
        await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    release(): void {
        const next = this.queue.shift();
        if (next) {
            next();
        } else {
            this.counter++;
        }
    }
}

class Trend {
    private redis: Redis;
    private hotCache: Map<string, CacheEntry> = new Map();
    private dbSemaphore = new Semaphore(5);

    private formStats: Map<string, FormStats> = new Map();
    private globalStats: GlobalStats = { count: 0, mean: 0, M2: 0 };

    private HOT_Z_THRESHOLD = 1.5;
    private TREND_Z_THRESHOLD = 2.5;
    private VIRAL_Z_THRESHOLD = 3.5;

    private HOT_FORM_EXPIRATION_MS = 10 * 60 * 1000; // ms  — for local Map
    private HOT_FORM_EXPIRATION_S = 10 * 60; // s   — for Redis
    private TREND_FORM_EXPIRATION_S = 60 * 60; // s   — for Redis

    constructor() {
        this.redis = cacheRedis;

        const methods = Object.getOwnPropertyNames(Trend.prototype).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );
        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getHotKey(key: string): string {
        return `hot:${key}`;
    }

    private getTrendKey(key: string): string {
        return `trend:${key}`;
    }

    private updateStats(formId: string, newScore: number): void {
        const form = this.formStats.get(formId) ?? { count: 0, mean: 0, M2: 0 };

        form.count += 1;
        const delta = newScore - form.mean;
        form.mean += delta / form.count;
        form.M2 += delta * (newScore - form.mean);

        this.formStats.set(formId, form);

        this.globalStats.count += 1;
        const globalDelta = newScore - this.globalStats.mean;
        this.globalStats.mean += globalDelta / this.globalStats.count;
        this.globalStats.M2 += globalDelta * (newScore - this.globalStats.mean);
    }

    private calculateZScore(formId: string): number {
        if (this.globalStats.count < 2) return 0;

        const form = this.formStats.get(formId) ?? { count: 0, mean: 0, M2: 0 };
        const sigma = Math.sqrt(this.globalStats.M2 / this.globalStats.count);

        if (sigma < 0.01) return 0;

        return (form.mean - this.globalStats.mean) / sigma;
    }

    public async getForm(formId: string): Promise<string | null> {
        const now = Date.now();
        const hotKey = this.getHotKey(formId);

        // L1 — in-memory
        const hotCached = this.hotCache.get(hotKey);
        if (hotCached) {
            if (hotCached.expireAt > now) return hotCached.data;
            this.hotCache.delete(hotKey);
        }

        // L2 — Redis hot:
        const hotRedisCached = await this.redis.get(hotKey);
        if (hotRedisCached) {
            this.hotCache.set(hotKey, {
                data: hotRedisCached,
                expireAt: now + this.HOT_FORM_EXPIRATION_MS,
            });
            return hotRedisCached;
        }

        // L3 — Redis trend:
        const trendCached = await this.redis.get(this.getTrendKey(formId));
        if (trendCached) {
            // repopulate L1 + L2
            this.hotCache.set(hotKey, {
                data: trendCached,
                expireAt: now + this.HOT_FORM_EXPIRATION_MS,
            });
            await this.redis.set(
                hotKey,
                trendCached,
                'EX',
                this.HOT_FORM_EXPIRATION_S
            );
            return trendCached;
        }

        return null;
    }

    public async handleDbFallback(
        formId: string,
        formData: string
    ): Promise<void> {
        const hotKey = this.getHotKey(formId);

        // Acquire semaphore — max 5 concurrent DB operations
        await this.dbSemaphore.acquire();

        try {
            // Recheck cache after waiting — another request may have populated it
            const cached = await this.getForm(formId);
            if (cached) return;

            const newScore = (this.formStats.get(formId)?.count ?? 0) + 1;
            this.updateStats(formId, newScore);
            const z = this.calculateZScore(formId);

            // Z ≥ 1.5 → L1 + L2
            if (z >= this.HOT_Z_THRESHOLD && !this.hotCache.has(hotKey)) {
                const expireAt = Date.now() + this.HOT_FORM_EXPIRATION_MS;
                this.hotCache.set(hotKey, { data: formData, expireAt });
                await this.redis.set(
                    hotKey,
                    formData,
                    'EX',
                    this.HOT_FORM_EXPIRATION_S
                );
            }

            // Z ≥ 2.5 → L3
            if (z >= this.TREND_Z_THRESHOLD) {
                await this.redis.set(
                    this.getTrendKey(formId),
                    formData,
                    'EX',
                    this.TREND_FORM_EXPIRATION_S,
                    'NX'
                );
            }

            // Z ≥ 3.5 → viral, aggressive TTL
            if (z >= this.VIRAL_Z_THRESHOLD) {
                await this.redis.set(
                    this.getTrendKey(formId),
                    formData,
                    'EX',
                    this.TREND_FORM_EXPIRATION_S / 2
                );
            }
        } finally {
            this.dbSemaphore.release();
        }
    }
}

export default Trend;
