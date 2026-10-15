'use client';
import { useState, useCallback } from 'react';
import axios from 'axios';
import { ApiResponse, RefreshTokenResponse } from '@/auth/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { getErrorMessage } from '@/api/error'; 

function useRefreshToken() {
    const [loading, setLoading] = useState(false);
    const handleRefreshToken =
        useCallback(async (): Promise<ApiResponse<RefreshTokenResponse>> => {
            setLoading(true);
            try {
                const { path } = endpoints.auth.refreshToken;
                const res = await http.post<RefreshTokenResponse>(path);
                return { ok: true, data: res.data };
            } catch (e: unknown) {
                let msg = 'Session expired. Please sign in again.';
                if (axios.isAxiosError<{ message?: string }>(e)) {
                    if (e.response) {
                        msg = getErrorMessage(e.response.status, {
                            message: e.response.data?.message,
                        });
                    } else if (e.request) {
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
