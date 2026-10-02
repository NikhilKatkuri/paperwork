'use client';

import { useCallback, useState } from 'react';
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
    const [saving, setSaving] = useState(false);
    const [outcome, setOutcome] = useState<SyncOutcome | null>(null);

    const handleUpdate = useCallback(async (id: string) => {
        setSaving(true);

        try {
            const result = await flushFormNow(id);
            setOutcome(result);
            return result;
        } catch (error) {
            const failure: SyncOutcome = {
                formId: id,
                changes: 0,
                sent: false,
                message:
                    error instanceof Error ? error.message : 'Sync failed',
            };

            setOutcome(failure);
            return failure;
        } finally {
            setSaving(false);
        }
    }, []);

    const handleUpdateAll = useCallback(async () => {
        setSaving(true);

        try {
            const results = await flushAllPending();
            setOutcome(
                results.find((r) => !r.sent && r.message) ??
                    results.find((r) => r.sent) ??
                    null
            );
        } finally {
            setSaving(false);
        }
    }, []);

    return { handleUpdate, handleUpdateAll, saving, outcome };
}

export default useUpdateForm;