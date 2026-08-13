'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useState } from 'react';
import { FormCore, Time } from '../../types';
import storageService from '@/providers/StorageService';

interface baseResponse {
    success: boolean;
    message: string;
}

type Response =
    | (baseResponse & { success: false })
    | (baseResponse & {
          success: true;
          data: { forms: FormCore[] };
      });

const CACHE_KEY = 'all_forms_cache';
type T = FormCore & Time;
export default function useGetAllForms() {
    const [loading, setLoading] = useState(false);

    async function handler(forceRefresh = false) {
        setLoading(true);

        try {
            // 1. Check local storage first (unless forcing a fresh network request)
            const cachedForms = storageService.get<T[]>(CACHE_KEY);

            if (cachedForms && !forceRefresh) {
                setLoading(false);
                return cachedForms; // Return cached response instantly
            }

            // 2. Fetch fresh data from API
            const { path } = endpoints.forms.allForms;
            const res = await http.get<Response>(path);

            if (res.data.success) {
                const forms = res.data.data.forms as T[];

                // 3. Persist the latest forms list to local storage
                storageService.set(CACHE_KEY, forms);

                return forms;
            }

            throw new Error(res.data.message);
        } catch (e) {
            // 4. Fallback: If network request fails, return cached data if available
            const fallbackCache = storageService.get<FormCore[]>(CACHE_KEY);
            if (fallbackCache) {
                console.warn('[useGetAllForms] Network failed. Serving stale cache fallback.');
                return fallbackCache;
            }

            if (e instanceof Error) {
                throw e;
            }

            throw new Error('Failed to load forms! Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    return {
        loading,
        handler,
    };
}