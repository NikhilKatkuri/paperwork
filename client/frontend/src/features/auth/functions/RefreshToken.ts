'use client';

import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { RefreshTokenResponse } from '@/auth/types/api.response.types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { getErrorMessage } from '@/api/error';

type RefreshTokenResult =
    { ok: true; data: RefreshTokenResponse } | { ok: false; error: string };

function useRefreshToken() {
    const [loading, setLoading] = useState<boolean>(false);

    const handleRefreshToken =
        useCallback(async (): Promise<RefreshTokenResult> => {
            setLoading(true);

            try {
                const { path } = endpoints.auth.refreshToken;
                const res = await http.post<RefreshTokenResponse>(path);

                if (res.status === 200) {
                    return { ok: true, data: res.data as RefreshTokenResponse };
                }

                return { ok: false, error: 'Unexpected response from server.' };
            } catch (e: unknown) {
                let msg = 'Session expired. Please sign in again.';

                if (axios.isAxiosError(e)) {
                    const err = e as AxiosError<{ message?: string }>;

                    if (err.response) {
                        const { status, data } = err.response;
                        msg = getErrorMessage(status, {
                            message: data?.message,
                        });
                    } else if (err.request) {
                        msg = 'Network error. Please check your connection.';
                    }
                }

                return { ok: false, error: msg };
            } finally {
                setLoading(false);
            }
        }, []);

    return { loading, handleRefreshToken };
}

export default useRefreshToken;
