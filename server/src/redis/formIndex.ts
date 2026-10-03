import { cacheRedis } from '@/redis';

export interface FormIndexEntry {
    _id: string;
    name: string;
}

interface CacheEntry {
    data: string;
    expireAt: number;
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

/**
 * Per-user cache of just `{_id, name}` for every form the user owns.
 *
 * One entry serves every query, so hit rate is far better than caching each
 * search term separately: typing "fee", "feed", "feedb" all reuse the same
 * entry. Filtering then happens in memory, which removes both the regex against
 * Mongo and the need for a `name` index at ordinary volumes.
 *
 * Follows the same L1 in-process / L2 Redis shape as `Trend`, but with explicit
 * invalidation on write (see `FormsService`) plus a short TTL as a safety net.
 */
class FormIndexCache {
    private hot = new Map<string, CacheEntry>();
    private dbSemaphore = new Semaphore(5);

    /** L1 lifetime - short, since writes invalidate explicitly. */
    private HOT_TTL_MS = 60 * 1000;
    /** L2 lifetime - the safety net for missed invalidations. */
    private REDIS_TTL_S = 5 * 60;
    /** Bound L1 growth across many users in one process. */
    private MAX_L1_ENTRIES = 500;

    private key(userId: string): string {
        return `formindex:${userId}`;
    }

    /**
     * Return the cached index, loading it through `loader` on a miss.
     *
     * Redis is treated as strictly optional: a cache failure falls through to
     * the loader rather than failing the request.
     */
    async getOrLoad(
        userId: string,
        loader: () => Promise<FormIndexEntry[]>
    ): Promise<FormIndexEntry[]> {
        const cached = await this.read(userId);
        if (cached) return cached;

        // Bound concurrent loads so a cold key cannot stampede the database.
        await this.dbSemaphore.acquire();

        try {
            // Another request may have populated it while we waited.
            const rechecked = await this.read(userId);
            if (rechecked) return rechecked;

            const rows = await loader();
            await this.write(userId, rows);

            return rows;
        } finally {
            this.dbSemaphore.release();
        }
    }

    private async read(userId: string): Promise<FormIndexEntry[] | null> {
        const key = this.key(userId);
        const now = Date.now();

        const hot = this.hot.get(key);
        if (hot) {
            if (hot.expireAt > now) return this.parse(hot.data);

            this.hot.delete(key);
        }

        try {
            const raw = await cacheRedis.get(key);
            if (!raw) return null;

            this.setHot(key, raw, now);

            return this.parse(raw);
        } catch (error) {
            // Redis unavailable - fall through to the loader.
            console.warn('[formIndex] cache read failed:', error);

            return null;
        }
    }

    private async write(userId: string, rows: FormIndexEntry[]): Promise<void> {
        const key = this.key(userId);
        const raw = JSON.stringify(rows);

        this.setHot(key, raw, Date.now());

        try {
            await cacheRedis.set(key, raw, 'EX', this.REDIS_TTL_S);
        } catch (error) {
            console.warn('[formIndex] cache write failed:', error);
        }
    }

    /**
     * Drop the cached index. Called whenever a form is created, renamed or
     * deleted, so a rename is visible on the next search.
     */
    async invalidate(userId: string): Promise<void> {
        const key = this.key(userId);

        this.hot.delete(key);

        try {
            await cacheRedis.del(key);
        } catch (error) {
            // Not fatal - the TTL will expire it anyway.
            console.warn('[formIndex] invalidation failed:', error);
        }
    }

    private setHot(key: string, data: string, now: number): void {
        if (this.hot.size >= this.MAX_L1_ENTRIES) {
            // Cheap eviction: drop the oldest insertion.
            const oldest = this.hot.keys().next();
            if (!oldest.done) this.hot.delete(oldest.value);
        }

        this.hot.set(key, { data, expireAt: now + this.HOT_TTL_MS });
    }

    private parse(raw: string): FormIndexEntry[] | null {
        try {
            const parsed = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
}

export const formIndexCache = new FormIndexCache();

export default FormIndexCache;
