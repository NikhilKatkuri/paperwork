'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useState } from 'react';
import { SignInResponse } from '../types/api.response.types';
import { AxiosError, isAxiosError } from 'axios';

export default function useTwoFactorAuth() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handler(otp: string) {
        setLoading(true);

        try {
            const { path } = endpoints.auth.verifyTwoFactor(otp);
            const res = await http.post(path);
            if (res.status === 200) {
                return { ok: true, data: res.data as SignInResponse };
            }
            return { ok: false, error: 'Unexpected response from server.' };
        } catch (e: unknown) {
            let msg = 'An unexpected error occurred. Please try again.';

            if (isAxiosError(e)) {
                const err = e as AxiosError<{ message?: string }>;

                if (err.response) {
                    const { status, data } = err.response;

                    if (status === 401) {
                        msg = 'Invalid email or password.';
                    } else if (status >= 400 && status < 500 && data?.message) {
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
    }

    return {
        loading,
        handler,
    };
}
