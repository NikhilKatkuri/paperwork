'use client';

import { useState } from 'react';
import { ApiResponse, SignUpRequestBody , SignUpResponse } from '@/auth/types'; 
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

import axios, { AxiosError } from 'axios';
 
function useSignUp() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleSignUp(
        credential: SignUpRequestBody
    ): Promise<ApiResponse<SignUpResponse>> {
        setLoading(true);

        try {
            const { path } = endpoints.auth.signUp;
            const res = await http.post<SignUpResponse>(path, credential);

            if (res.status === 200 || res.status === 201) {
                return { ok: true, data: res.data as SignUpResponse };
            }

            return { ok: false, error: 'Unexpected response from server.' };
        } catch (e: unknown) {
            let msg = 'An unexpected error occurred. Please try again.';

            if (axios.isAxiosError(e)) {
                const err = e as AxiosError<{ message?: string }>;

                if (err.response) {
                    const { status, data } = err.response;

                    if (status === 409) {
                        msg = 'An account with this email already exists.';
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
        handleSignUp,
    };
}

export default useSignUp;
