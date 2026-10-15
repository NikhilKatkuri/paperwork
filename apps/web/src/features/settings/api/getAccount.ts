import { useState, useCallback } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import storage_buckets from '@/config';

export interface AccountData {
    twofactorEnabled: boolean;
}

interface AccountResponse {
    success: boolean;
    data: AccountData;
    message: string;
}

export interface CacheItem {
    expAt: number;
    data: AccountData;
}
export const CACHE_TTL_MS = 60 * 60 * 1000;

function useAccountMetaOnly() {
    const [loading, setLoading] = useState(false);

    const getCache = useCallback((): AccountData | null => {
        try {
            const raw = localStorage.getItem(storage_buckets.account);
            if (!raw) return null;

            const item = JSON.parse(raw) as CacheItem;
            const now = Date.now();

            if (now < item.expAt) {
                return item.data;
            }

            localStorage.removeItem(storage_buckets.account);
            return null;
        } catch {
            return null;
        }
    }, []);

    const storeCache = useCallback((data: AccountData) => {
        const cacheItem: CacheItem = {
            expAt: Date.now() + CACHE_TTL_MS,
            data,
        };

        localStorage.setItem(
            storage_buckets.account,
            JSON.stringify(cacheItem)
        );
    }, []);

    const accountMeta = useCallback(async (): Promise<AccountData | null> => {
        const cache = getCache();

        // if cache exists and is not expired, NO API CALL
        if (cache) return cache;

        setLoading(true);

        try {
            const { path } = endpoints.auth.account;
            const res = await http.get<AccountResponse>(path);

            if (res.data.success && res.data.data) {
                storeCache(res.data.data);
                return res.data.data;
            }

            return null;
        } catch (error) {
            console.error('Error fetching account data:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getCache, storeCache]);

    return {
        loading,
        accountMeta,
    };
}

export default useAccountMetaOnly;
