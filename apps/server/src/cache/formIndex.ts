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
    private readonly queue: (() => void)[] = [];

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
 * Purely in-memory: explicit invalidation on write (see `FormsService`) keeps
 * entries fresh, and a short TTL acts as the safety net for anything missed.
 */
class FormIndexCache {
    private readonly hot = new Map<string, CacheEntry>();
    private readonly dbSemaphore = new Semaphore(5);

    /** Entry lifetime - short, since writes invalidate explicitly. */
    private readonly HOT_TTL_MS = 60 * 1000;
    /** Bound growth across many users in one process. */
    private readonly MAX_ENTRIES = 500;

    private key(userId: string): string {
        return `formindex:${userId}`;
    }

    /**
     * Return the cached index, loading it through `loader` on a miss.
     */
    async getOrLoad(
        userId: string,
        loader: () => Promise<FormIndexEntry[]>
    ): Promise<FormIndexEntry[]> {
        const cached = this.read(userId);
        if (cached) return cached;

        // Bound concurrent loads so a cold key cannot stampede the database.
        await this.dbSemaphore.acquire();

        try {
            // Another request may have populated it while we waited.
            const rechecked = this.read(userId);
            if (rechecked) return rechecked;

            const rows = await loader();
            this.write(userId, rows);

            return rows;
        } finally {
            this.dbSemaphore.release();
        }
    }

    private read(userId: string): FormIndexEntry[] | null {
        const key = this.key(userId);
        const now = Date.now();

        const hot = this.hot.get(key);
        if (!hot) return null;

        if (hot.expireAt > now) return this.parse(hot.data);

        this.hot.delete(key);
        return null;
    }

    private write(userId: string, rows: FormIndexEntry[]): void {
        const key = this.key(userId);

        this.setHot(key, JSON.stringify(rows), Date.now());
    }

    /**
     * Drop the cached index. Called whenever a form is created, renamed or
     * deleted, so a rename is visible on the next search.
     */
    async invalidate(userId: string): Promise<void> {
        this.hot.delete(this.key(userId));
    }

    private setHot(key: string, data: string, now: number): void {
        if (this.hot.size >= this.MAX_ENTRIES) {
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
