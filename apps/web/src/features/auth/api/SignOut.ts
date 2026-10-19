'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { SignOutResponse } from '@/auth/types/';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { clearClientCaches } from '@/lib/clientCaches';

function useSignOut() {
    const { loading, execute: handleSignOut } = useApiAction(async () => {
        try {
            const response = await http.post<SignOutResponse>(
                endpoints.auth.signOut
            );

            toast.loading(
                'Your session has expired. Please sign in again to continue.',
                { duration: 2000, position: 'top-center' }
            );
            setTimeout(() => {
                toast.dismiss();
                redirect('/');
            }, 500);

            return response;
        } finally {
            // Runs even when the sign-out request itself failed: a shared
            // device must not keep the previous user's PII because the
            // request happened to error (offline, expired cookie, ...).
            await clearClientCaches();
        }
    });

    return {
        loading,
        handleSignOut,
    };
}

export default useSignOut;
