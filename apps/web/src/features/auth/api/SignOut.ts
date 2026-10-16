'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { SignOutResponse } from '@/auth/types/';
import storage_buckets from '@/config';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import syncQueueDB from '@/features/forms/lib/sync-queue.db';

function useSignOut() {
    const { loading, execute: handleSignOut } = useApiAction(async () => {
        const response = await http.post<SignOutResponse>(
            endpoints.auth.signOut
        );

        localStorage.removeItem(storage_buckets.profile);
        localStorage.removeItem(storage_buckets.cloudinary);
        // Clear every client cache so a shared device does not leak the
        // previous user's PII to the next session.
        for (const key of Object.values(storage_buckets)) {
            try {
                localStorage.removeItem(key as string);
            } catch { /* ignore */ }
        }
        try {
            localStorage.removeItem('paperwork:form-theme');
        } catch { /* ignore */ }
        await db.forms.clear();
        await syncQueueDB.syncQueue.clear();
        try {
            await db.preferences.clear();
        } catch { /* ignore */ }
        toast.loading(
            'Your session has expired. Please sign in again to continue.',
            { duration: 2000, position: 'top-center' }
        );
        setTimeout(() => {
            toast.dismiss();
            redirect('/');
        }, 500);

        return response;
    });

    return {
        loading,
        handleSignOut,
    };
}

export default useSignOut;
