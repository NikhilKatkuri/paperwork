'use client';

import { useState } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

import axios, { AxiosError } from 'axios';
import { SignOutResponse } from '@/auth/types/api.response.types';
import storage_buckets from '@/config';

type SignOutResult =
    { ok: true; data: SignOutResponse } | { ok: false; error: string };

function useSignOut() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleSignOut(accessToken: string): Promise<SignOutResult> {
        setLoading(true);

        try {
            const { path } = endpoints.auth.signOut;
            const res = await http.post<SignOutResponse>(path, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (res.status === 200 || res.status === 201) {
                localStorage.removeItem(storage_buckets.profile);
                localStorage.removeItem(storage_buckets.cloudinary);
                return { ok: true, data: res.data as SignOutResponse };
            }

            return { ok: false, error: 'Unexpected response from server.' };
        } catch (e: unknown) {
            let msg = 'An unexpected error occurred. Please try again.';

            if (axios.isAxiosError(e)) {
                const err = e as AxiosError<{ message?: string }>;

                if (err.response) {
                    const { status, data } = err.response;

                    if (status === 401) {
                        msg = 'Session expired. Please sign in again.';
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
        handleSignOut,
    };
}

export default useSignOut;
