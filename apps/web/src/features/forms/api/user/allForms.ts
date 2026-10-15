'use client';

import { useCallback, useState } from 'react';
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
const CACHE_TTL_MINUTES = 60 * 24;

/** The API caps `limit` at 100 and silently defaults to 10. */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

async function fetchAllPages(signal?: AbortSignal): Promise<FormDB[]> {
    const all: FormDB[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await http.get<ApiResponse>(
            `${endpoints.forms.allForms.path}?limit=${PAGE_SIZE}&page=${page}`,
            { signal }
        );

        if (!res.data.success) {
            throw new Error(res.data.message || 'Failed to fetch forms');
        }

        const forms = res.data.data.forms ?? [];
        all.push(...forms);

        // A short page means the last page has been read.
        if (forms.length < PAGE_SIZE) break;
    }

    storageService.set(CACHE_KEY, all, CACHE_TTL_MINUTES);

    return all;
}

export default function useGetAllForms() {
    const [loading, setLoading] = useState(false);

    const handler = useCallback(
        async (signal?: AbortSignal): Promise<FormDB[]> => {
            setLoading(true);

            try {
                let snapshot: FormDB[];

                try {
                    snapshot = await fetchAllPages(signal);
                } catch (err) {
                    // An abort is caller-driven cancellation, not a failure -
                    // never mask it by serving stale cache.
                    if (signal?.aborted) throw err;

                    // Only a failed fetch may fall back to cache. Repository
                    // errors below must surface rather than be reported as a
                    // network blip.
                    const cached = storageService.get<FormDB[]>(CACHE_KEY);

                    if (!cached) {
                        throw err instanceof Error
                            ? err
                            : new Error(
                                  'Failed to load forms! Please try again later.'
                              );
                    }

                    console.warn(
                        '[useGetAllForms] Serving stale cache fallback.',
                        err
                    );
                    snapshot = cached;
                }

                if (signal?.aborted) throw new Error('aborted');

                // `seedMany` keeps records with pending local edits intact, so
                // the rows read back here are the authoritative merged view.
                await formRepository.seedMany(snapshot);

                return await formRepository.getAll();
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { loading, handler };
}