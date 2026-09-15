'use client';

import { useState, useCallback } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import storageService from '@/providers/StorageService';
import formRepository from '../../repositories/formRepository';
import { FormDB } from '@/lib/db';

interface BaseResponse {
    success: boolean;
    message: string;
}

type ApiResponse =
    | (BaseResponse & { success: false })
    | (BaseResponse & {
          success: true;
          data: { forms: FormDB[] };
      });

const CACHE_KEY = 'all_forms_cache';

export default function useGetAllForms() {
    const [loading, setLoading] = useState(false);

    const handler = useCallback(
        async (forceRefresh = false): Promise<FormDB[]> => {
            setLoading(true);

            try {
                const localForms = (await formRepository.getAll()) ?? [];

                if (!forceRefresh) {
                    const cachedForms = storageService.get<FormDB[]>(CACHE_KEY);
                    if (cachedForms) {
                        return mergeUniqueForms(localForms, cachedForms);
                    }
                }

                const { path } = endpoints.forms.allForms;
                const res = await http.get<ApiResponse>(path);

                if (res.data.success) {
                    const apiForms = res.data.data.forms;

                    storageService.set(CACHE_KEY, apiForms);

                    return mergeUniqueForms(localForms, apiForms);
                }

                throw new Error(res.data.message || 'Failed to fetch forms');
            } catch (e) {
                const fallbackCache = storageService.get<FormDB[]>(CACHE_KEY);
                if (fallbackCache) {
                    console.warn(
                        '[useGetAllForms] Serving stale cache fallback.'
                    );
                    const localForms = (await formRepository.getAll()) ?? [];
                    return mergeUniqueForms(localForms, fallbackCache);
                }

                if (e instanceof Error) throw e;
                throw new Error(
                    'Failed to load forms! Please try again later.'
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { loading, handler };
}

function mergeUniqueForms(local: FormDB[], remote: FormDB[]): FormDB[] {
    const map = new Map<string, FormDB>();

    remote.forEach((f) => f._id && map.set(f._id, f));
    local.forEach((f) => f._id && map.set(f._id, f));

    return Array.from(map.values());
}
