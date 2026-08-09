'use client';

import { useState, useCallback } from 'react';
import { ForgotPasswordResponse } from '../types/api.response.types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

import axios, { AxiosError } from 'axios';
import { ResetPasswordRequest } from '../types/api.request.types';

type ResetPasswordResult =
    { ok: true; data: ForgotPasswordResponse } | { ok: false; error: string };

const useResetPassword = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const handleResetPassword = useCallback(
        async (
            credentials: ResetPasswordRequest,
            token: string
        ): Promise<ResetPasswordResult> => {
            setLoading(true);
            try {
                const { path } = endpoints.auth.resetPassword(token);
                const res = await http.post<ForgotPasswordResponse>(
                    path,
                    credentials
                );

                if (res.status === 200) {
                    return {
                        ok: true,
                        data: res.data as ForgotPasswordResponse,
                    };
                }

                return { ok: false, error: 'Unexpected response from server.' };
            } catch (e: unknown) {
                let msg = 'An unexpected error occurred. Please try again.';

                if (axios.isAxiosError(e)) {
                    const err = e as AxiosError<{ message?: string }>;

                    if (err.response) {
                        const { status, data } = err.response;

                        if (status >= 400 && status < 500 && data?.message) {
                            msg = data.message;
                        } else if (status >= 500) {
                            msg = 'Server error. Please try again later.';
                        } else {
                            msg = 'An error occurred. Please try again.';
                        }
                    } else if (err.request) {
                        msg = 'Network error. Please check your connection.';
                    }
                }

                return { ok: false, error: msg };
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { loading, handleResetPassword };
};

export default useResetPassword;
