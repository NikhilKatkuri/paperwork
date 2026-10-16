'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import { useUpdateForm } from '../../api/updateForm';
import { syncQueueRepository } from '../../lib/sync-queue.repository';
import { onSyncChange } from '../../lib/sync-engine';
import { useForm } from '../../providers/form';

function SyncStatus() {
    const { formId: activeFormID } = useForm();
    const { handleUpdate, saving } = useUpdateForm();

    const [queued, setQueued] = useState<{
        formId: string | null;
        count: number;
    }>({ formId: null, count: 0 });

    useEffect(() => {
        if (!activeFormID) return;

        const alive = true;

        const refresh = async () => {
            try {
                const rows = await syncQueueRepository.getPending(activeFormID);
                if (alive)
                    setQueued({ formId: activeFormID, count: rows.length });
            } catch (error) {
                console.warn('[sync] could not read queue', error);
            }
        };

        void refresh();

        return onSyncChange(() => {
            void refresh();
        });
    }, [activeFormID]);
    const pending = queued.formId === activeFormID ? queued.count : 0;

    const saveNow = useCallback(async () => {
        if (!activeFormID) return;

        const result = await handleUpdate(activeFormID);

        if (!result.sent) {
            toast.error(result.message ?? 'Nothing to sync yet');
        } else if (result.message) {
            toast.warning(result.message);
        }
    }, [activeFormID, handleUpdate]);

    if (!activeFormID) return null;

    const hasPending = pending > 0;

    return (
        <div className="flex items-center gap-3">
            <span
                className={cn(
                    'text-theme-form-on-surface/70 hidden text-xs sm:inline',
                    hasPending && 'text-theme-form-on-surface'
                )}
            >
                {saving
                    ? 'Saving…'
                    : hasPending
                      ? `${pending} unsaved ${pending === 1 ? 'change' : 'changes'}`
                      : 'All changes saved'}
            </span>

            <button
                type="button"
                onClick={saveNow}
                disabled={!hasPending || saving}
                className={cn(
                    'rounded-md border px-3 py-1.5 text-xs transition-all',
                    hasPending && !saving
                        ? 'border-theme-form-container-active text-theme-form-on-surface hover:bg-theme-form-container-active/10 cursor-pointer'
                        : 'text-theme-form-on-surface/40 cursor-default border-transparent'
                )}
            >
                {saving ? 'Saving…' : 'Save now'}
            </button>
        </div>
    );
}

export default SyncStatus;
