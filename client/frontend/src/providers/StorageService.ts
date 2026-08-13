class LocalStorageService {
    // Check if window/localStorage is available (prevents SSR errors in Next.js)
    private static isAvailable(): boolean {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    }

    /**
     * Store an item in localStorage
     * @param key Storage key
     * @param value Data to store (objects/arrays will be automatically stringified)
     * @param ttlInMinutes Optional time-to-live in minutes
     */
    static set<T>(key: string, value: T, ttlInMinutes?: number): boolean {
        if (!this.isAvailable()) return false;

        try {
            const dataToStore = {
                value,
                expiry: ttlInMinutes ? Date.now() + ttlInMinutes * 60 * 1000 : null,
            };

            window.localStorage.setItem(key, JSON.stringify(dataToStore));
            return true;
        } catch (error) {
            console.error(`[LocalStorage] Error saving key "${key}":`, error);
            return false;
        }
    }

    /**
     * Retrieve an item from localStorage
     * @param key Storage key
     * @param fallback Default value if key doesn't exist or is expired
     */
    static get<T>(key: string, fallback: T | null = null): T | null {
        if (!this.isAvailable()) return fallback;

        try {
            const itemStr = window.localStorage.getItem(key);
            if (!itemStr) return fallback;

            const item = JSON.parse(itemStr);

            // Handle non-wrapper legacy raw strings if any exist
            if (typeof item !== 'object' || item === null || !('value' in item)) {
                return item as T;
            }

            // Check for expiration
            if (item.expiry && Date.now() > item.expiry) {
                this.remove(key); // Clean up expired data
                return fallback;
            }

            return item.value as T;
        } catch (error) {
            console.error(`[LocalStorage] Error parsing key "${key}":`, error);
            return fallback;
        }
    }

    /**
     * Remove a single item from localStorage
     */
    static remove(key: string): boolean {
        if (!this.isAvailable()) return false;

        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[LocalStorage] Error removing key "${key}":`, error);
            return false;
        }
    }

    /**
     * Clear all localStorage keys
     */
    static clear(): boolean {
        if (!this.isAvailable()) return false;

        try {
            window.localStorage.clear();
            return true;
        } catch (error) {
            console.error('[LocalStorage] Error clearing storage:', error);
            return false;
        }
    }
}

const storageService = LocalStorageService;

export default storageService;