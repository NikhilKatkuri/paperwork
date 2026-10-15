import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { getErrorMessage } from '@/api/error';
import axios, { AxiosError } from 'axios';
import { useState, useCallback } from 'react';
import { AccountData, CACHE_TTL_MS, CacheItem } from './getAccount';
import storage_buckets from '@/config';

export interface AccountActionService {
    action:
        'delete-account' | 'enable-2fa' | 'disable-2fa' | 'deactivate-account';
    password: string;
}

interface BaseResponse {
    success: boolean;
    message: string;
}

type AccountActionData = Record<string, string | boolean | number>;

export type AccountActionResponse =
    BaseResponse | (BaseResponse & { data: AccountActionData });

export type AccountActionResult =
    { ok: true; data: AccountActionResponse } | { ok: false; error: string };

export default function useAccountAction() {
    const [saving, setSaving] = useState<boolean>(false);

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

    const handleSubmit = useCallback(
        async ({
            action,
            password,
        }: AccountActionService): Promise<AccountActionResult> => {
            if (!action || !password) {
                return {
                    ok: false,
                    error: 'Action and password are required.',
                };
            }

            setSaving(true);

            try {
                const { path } = endpoints.auth.accountAction;
                const res = await http.post<AccountActionResponse>(path, {
                    action,
                    password,
                });

                if (res.data && res.data.success) {
                    storeCache({
                        twofactorEnabled:
                            action === 'enable-2fa' ? true : false,
                    });
                    return { ok: true, data: res.data };
                }

                return {
                    ok: false,
                    error:
                        res.data?.message ||
                        'Failed to execute account action.',
                };
            } catch (e: unknown) {
                let msg = 'An unexpected error occurred. Please try again.';

                if (axios.isAxiosError(e)) {
                    const err = e as AxiosError<{ message?: string }>;

                    if (err.response) {
                        const { status, data } = err.response;
                        msg =
                            data?.message ||
                            getErrorMessage(status, { message: data?.message });
                    } else if (err.request) {
                        msg = 'Network error. Please check your connection.';
                    }
                }

                return { ok: false, error: msg };
            } finally {
                setSaving(false);
            }
        },
        [storeCache]
    );

    return {
        saving,
        handleSubmit,
    };
}
