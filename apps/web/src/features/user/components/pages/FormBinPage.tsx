'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FORM_BIN_RETENTION_DAYS } from '@paperwork/types';
import {
    emptyBin,
    fetchBinForms,
    deleteFormsPermanently,
    restoreForms,
} from '@/features/forms/api/user/formBin';
import formRepository from '@/features/forms/repositories/formRepository';
import { toDate } from '@/features/forms/types/db.types';
import type { FormDB } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

function remainingLabel(deletedAt: string | undefined, now: number): string {
    if (!deletedAt) return '—';
    const moved = new Date(deletedAt).getTime();
    if (Number.isNaN(moved)) return '—';

    const left = Math.max(0, moved + FORM_BIN_RETENTION_DAYS * DAY_MS - now);
    if (left === 0) return 'Expiring now';

    const days = Math.floor(left / DAY_MS);
    const hours = Math.floor((left % DAY_MS) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((left % (60 * 60 * 1000)) / 60_000);
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function FormBinPage() {
    const [forms, setForms] = useState<FormDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [emptying, setEmptying] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    const load = useCallback(async () => {
        try {
            await formRepository.purgeExpiredLocally();
            const cached = await formRepository.getTrashed();
            setForms(cached);

            const remote = await fetchBinForms();
            const remoteIds = new Set(remote.map((form) => form.id));
            await Promise.all(
                remote.map((form) => formRepository.moveToBin(form.id, form.deletedAt ?? ''))
            );
            setForms((current) => {
                const kept = current.filter((form) => !remoteIds.has(form.id));
                return [...remote, ...kept];
            });
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to load the bin'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load());
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, [load]);

    const handleRestore = useCallback(
        async (formId: string) => {
            setBusyId(formId);
            try {
                const result = await restoreForms([formId]);
                if (result.errors.length) throw new Error(result.errors[0]);
                setForms((current) => current.filter((form) => form.id !== formId));
                toast.success('Form restored');
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Failed to restore form'
                );
            } finally {
                setBusyId(null);
            }
        },
        []
    );

    const handlePermanentDelete = useCallback(async (formId: string) => {
        setBusyId(formId);
        try {
            const result = await deleteFormsPermanently([formId]);
            if (result.errors.length) throw new Error(result.errors[0]);
            setForms((current) => current.filter((form) => form.id !== formId));
            toast.success('Permanent deletion scheduled');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to delete form'
            );
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleEmpty = useCallback(async () => {
        setEmptying(true);
        try {
            const deleted = await emptyBin();
            setForms([]);
            toast.success(
                `Scheduled ${deleted} form${deleted === 1 ? '' : 's'} for deletion`
            );
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to empty the bin'
            );
        } finally {
            setEmptying(false);
        }
    }, []);

    return (
        <main className="relative mx-auto h-full w-full max-w-7xl scrollbar-none overflow-y-auto px-2 min-[44rem]:px-5">
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Link
                        href="/user"
                        title="Back to forms"
                        aria-label="Back to forms"
                        className="hover:bg-brand-light/60 text-theme-on-surface/70 hover:text-theme-on-surface flex aspect-square h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
                    >
                        <span className="material-symbols-outlined text-xl">
                            arrow_back
                        </span>
                    </Link>
                    <div>
                        <h1 className="text-xl leading-tight font-semibold">Bin</h1>
                        <p className="text-theme-on-surface/60 text-xs">
                            {forms.length} form{forms.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void handleEmpty()}
                    disabled={emptying || forms.length === 0}
                    className="bg-brand-depth/95 text-on-brand-depth flex items-center gap-2 rounded-full px-4 py-2 text-sm disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-base">
                        delete_sweep
                    </span>
                    {emptying ? 'Emptying…' : 'Empty bin'}
                </button>
            </div>

            <p className="text-theme-on-surface/60 mt-3 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">
                    schedule
                </span>
                Forms stay here for {FORM_BIN_RETENTION_DAYS} days. After that
                they are deleted automatically and cannot be recovered.
            </p>

            <div className="mt-6 grid gap-3">
                {loading ? (
                    <div role="status" aria-label="Loading bin" className="grid gap-3">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div
                                key={i}
                                className="bg-theme-on-surface/8 h-16 animate-pulse rounded-md"
                            />
                        ))}
                        <span className="sr-only">Loading bin…</span>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="text-theme-on-surface/80 flex flex-col items-center gap-2 py-10 text-center">
                        <span className="material-symbols-outlined text-theme-on-surface/30 text-5xl">
                            delete
                        </span>
                        <h2 className="font-semibold">Bin is empty</h2>
                        <p className="text-sm">
                            Forms you delete are kept here for{' '}
                            {FORM_BIN_RETENTION_DAYS} days.
                        </p>
                    </div>
                ) : (
                    forms.map((form) => {
                        const busy = busyId === form.id;
                        return (
                            <div
                                key={form.id}
                                className="hover:bg-brand-light/60 grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-transparent px-4 py-3 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {form.name || 'Untitled form'}
                                    </p>
                                    <p className="text-theme-on-surface/60 flex items-center gap-1.5 text-xs">
                                        <span className="material-symbols-outlined text-base">
                                            schedule
                                        </span>
                                        Moved to bin {toDate(form.deletedAt)} ·{' '}
                                        <span className="text-amber-600">
                                            {remainingLabel(form.deletedAt, now)}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void handleRestore(form.id)}
                                        className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            restore
                                        </span>
                                        {busy ? 'Working…' : 'Restore'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            void handlePermanentDelete(form.id)
                                        }
                                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            delete_forever
                                        </span>
                                        Delete permanently
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
