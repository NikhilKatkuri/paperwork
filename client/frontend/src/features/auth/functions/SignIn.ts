'use client';

import { useState } from 'react';
import { SignInRequestBody } from '@/auth/types/api.request.types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

import axios, { AxiosError } from 'axios';
import { SignInResponse } from '@/auth/types/api.response.types';

type SignInResult =
    { ok: true; data: SignInResponse } | { ok: false; error: string };

function useSignIn() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleSignIn(
        credential: SignInRequestBody
    ): Promise<SignInResult> {
        setLoading(true);

        try {
            const { path } = endpoints.auth.signIn;
            const res = await http.post<SignInResponse>(path, credential);

            if (res.status === 200) {
                return { ok: true, data: res.data as SignInResponse };
            }

            return { ok: false, error: 'Unexpected response from server.' };
        } catch (e: unknown) {
            let msg = 'An unexpected error occurred. Please try again.';

            if (axios.isAxiosError(e)) {
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
        handleSignIn,
    };
}

export default useSignIn;
