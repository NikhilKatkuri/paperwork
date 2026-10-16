'use client';

import { useState } from 'react';
import { useApiAction } from '@/hooks/useApiAction';
import {
    flushFormNow,
    flushAllPending,
    type SyncOutcome,
} from '../lib/sync-engine';

/**
 * Manual sync controls for a form editor.
 *
 * Edits are normally pushed automatically by the debounced flush in
 * `FormCreateProvider`; this exposes an explicit "save now" for UI that wants
 * one, and a status the UI can render.
 */
export function useUpdateForm() {
    const [outcome, setOutcome] = useState<SyncOutcome | null>(null);

    const { loading: updating, execute: executeUpdate } = useApiAction(
        async (id: string) => ({
            data: await flushFormNow(id),
        })
    );
    const { loading: updatingAll, execute: executeUpdateAll } = useApiAction(
        async () => ({
            data: await flushAllPending(),
        })
    );

    const handleUpdate = async (id: string) => {
        const response = await executeUpdate(id);
        const result: SyncOutcome = response.ok
            ? response.data
            : {
                  formId: id,
                  changes: 0,
                  sent: false,
                  message: response.error,
              };

        setOutcome(result);
        return result;
    };

    const handleUpdateAll = async () => {
        const response = await executeUpdateAll();
        if (!response.ok) {
            throw new Error(response.error);
        }

        const results = response.data;
        setOutcome(
            results.find((r) => !r.sent && r.message) ??
                results.find((r) => r.sent) ??
                null
        );
    };

    return {
        handleUpdate,
        handleUpdateAll,
        saving: updating || updatingAll,
        outcome,
    };
}

export default useUpdateForm;
