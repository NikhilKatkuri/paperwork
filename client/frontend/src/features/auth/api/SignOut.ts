'use client';

import { useState } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

import axios, { AxiosError } from 'axios';
import { SignOutResponse, ApiResponse } from '@/auth/types/';
import storage_buckets from '@/config';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

function useSignOut() {
    const [loading, setLoading] = useState<boolean>(false);

    async function handleSignOut(): Promise<ApiResponse<SignOutResponse>> {
        setLoading(true);

        try {
            const { path } = endpoints.auth.signOut;
            const res = await http.post<SignOutResponse>(path);

            if (res.status === 200 || res.status === 201) {
                localStorage.removeItem(storage_buckets.profile);
                localStorage.removeItem(storage_buckets.cloudinary);
                toast.loading(
                    'Your session has expired. Please sign in again to continue.',
                    { duration: 2000, position: 'top-center' }
                );
                setTimeout(() => {
                    toast.dismiss();
                    redirect('/');
                }, 500);
                return { ok: true, data: res.data };
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
