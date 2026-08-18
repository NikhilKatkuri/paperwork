'use client';

import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { ApiResponse, EmailCheckRequestBody, EmailCheckResponse } from '../types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

function useEmailCheckUp() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleEmailCheck(
        credential: EmailCheckRequestBody
    ): Promise<ApiResponse<EmailCheckResponse>> {
        setLoading(true);

        try {
            const { path } = endpoints.auth.checkEmailExists;
            const res = await http.post<EmailCheckResponse>(path, credential);

            if (res.status === 200) {
                return { ok: true, data: res.data as EmailCheckResponse };
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
    }

    return {
        loading,
        handleEmailCheck,
    };
}

export default useEmailCheckUp;
