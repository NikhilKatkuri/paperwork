'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { cn } from '@/utils/cn';
import useGetForms from '@/features/forms/api/user/getAllForms';
import { useEnsureForm } from '@/features/forms/api/user/formSearch';
import { uiPreferencesDB } from '@/features/user/components/lib/UiPreferences';
import formRepository from '@/features/forms/repositories/formRepository';
import { cancelFlush } from '@/features/forms/lib/sync-engine';
import { syncQueueRepository } from '@/features/forms/lib/sync-queue.repository';
import { endpoints } from '@/api/endpoints';
import { ApiError, http } from '@/api/http';
import type { FormDB } from '@/types';

interface UserFormsProps {
    /** Already debounced by the parent. */
    query?: string;
}

type SortMethod = 'plain' | 'alphabetical-forward' | 'alphabetical-reverse';

function UserForms({ query = '' }: Readonly<UserFormsProps>) {
    const [viewAsRow, setViewAsRow] = useState(true);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);
    const [data, setData] = useState<FormDB[]>([]);
    const [sortMethod, setSortMethod] = useState<SortMethod>('plain');
    const [fetchComplete, setFetchComplete] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // 1. Memoize options to ensure `next` function reference remains stable across renders
    const getFormsOptions = useMemo(() => ({ page: 1, limit: 20 }), []);

    const { loading, next } = useGetForms(getFormsOptions);
    const { ensureForm } = useEnsureForm();
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadPreferences() {
            try {
                const preferences =
                    await uiPreferencesDB.preferences.get('preferences');

                if (!cancelled && preferences) {
                    setViewAsRow(preferences.viewAs === 'row');
                }
            } catch {
                if (!cancelled) {
                    toast.error('Failed to load view preferences');
                }
            } finally {
                if (!cancelled) {
                    setPreferencesLoaded(true);
                }
            }
        }

        void loadPreferences();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!preferencesLoaded) return;

        uiPreferencesDB.preferences
            .put({
                id: 'preferences',
                viewAs: viewAsRow ? 'row' : 'grid',
            })
            .catch(() => {
                toast.error('Failed to save view preferences');
            });
    }, [viewAsRow, preferencesLoaded]);

    const toggleView = useCallback(() => {
        setViewAsRow((current) => !current);
    }, []);

    const sort = useCallback(() => {
        setSortMethod((current) =>
            current === 'plain' || current === 'alphabetical-reverse'
                ? 'alphabetical-forward'
                : 'alphabetical-reverse'
        );
    }, []);

    const handleDelete = useCallback(async (formId: string) => {
        setBusyId(formId);
        try {
            cancelFlush(formId);
            await http.delete(endpoints.forms.deleteForm(formId));
            await syncQueueRepository.deleteForForm(formId);
            await formRepository.delete(formId);
            setData((prev) => prev.filter((f) => f.id !== formId));
            toast.success('Form deleted');
        } catch (error) {
            toast.error(
                error instanceof ApiError || error instanceof Error
                    ? error.message
                    : 'Failed to delete form'
            );
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleDuplicate = useCallback(
        async (formId: string) => {
            setBusyId(formId);
            try {
                const res = await http.post<{ form: { id?: string; _id?: string } }>(
                    endpoints.forms.duplicateForm(formId),
                    {}
                );
                const raw = res.data.form ?? res.data;
                const newId =
                    (raw as { id?: string }).id ??
                    (raw as unknown as { _id?: string })._id;
                if (!newId) throw new Error('Duplicate failed');
                // Cache the full copy so the dashboard and editor agree.
                await ensureForm(String(newId));
                const fresh = await formRepository.get(String(newId));
                if (fresh) {
                    setData((prev) => [fresh, ...prev]);
                }
                toast.success('Form duplicated');
            } catch (error) {
                toast.error(
                    error instanceof ApiError || error instanceof Error
                        ? error.message
                        : 'Failed to duplicate form'
                );
            } finally {
                setBusyId(null);
            }
        },
        [ensureForm]
    );

    useEffect(() => {
        let cancelled = false;

        async function fetchForms() {
            setLoadError(null);
            try {
                const allForms: FormDB[] = [];

                while (!cancelled) {
                    const forms = await next();

                    if (cancelled) return;

                    // Stop pagination if no forms are returned or if forms is null/undefined
                    if (!forms || forms.length === 0) break;

                    allForms.push(...forms);
                }

                if (!cancelled) {
                    setData(allForms);
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    // A failed load must not masquerade as "No forms yet".
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load forms'
                    );
                }
            } finally {
                // Ensure loading state finishes cleanly
                if (!cancelled) {
                    setFetchComplete(true);
                }
            }
        }

        void fetchForms();

        return () => {
            cancelled = true;
        };
    }, [next, retryCount]);

    const displayedForms = useMemo(() => {
        const term = query.trim().toLowerCase();

        const forms = data.filter((form) =>
            (form.name ?? '').toLowerCase().includes(term)
        );

        return forms.sort((a, b) => {
            if (sortMethod === 'alphabetical-forward') {
                return (a.name ?? '').localeCompare(b.name ?? '');
            }

            if (sortMethod === 'alphabetical-reverse') {
                return (b.name ?? '').localeCompare(a.name ?? '');
            }

            const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

            return updatedB - updatedA;
        });
    }, [data, query, sortMethod]);

    const isSearching = query.trim().length > 0;
    const isLoading = loading || !fetchComplete;

    return (
        <>
            <ViewFormsHeader
                viewAsRow={viewAsRow}
                setViewAsRow={toggleView}
                sort={sort}
            />

            {isSearching && data.length > 0 && (
                <p className="text-theme-on-surface/60 mt-4 text-xs">
                    {displayedForms.length} of {data.length}{' '}
                    {data.length === 1 ? 'form' : 'forms'} match
                </p>
            )}

            <div className="mt-5 h-auto flex-1">
                <div
                    className={cn(
                        'grid',
                        viewAsRow
                            ? 'w-full'
                            : 'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                    )}
                >
                    {isLoading ? (
                        <div
                            role="status"
                            aria-label="Loading forms"
                            className="text-theme-on-surface/60 col-span-full grid gap-3 py-8"
                        >
                            {Array.from({ length: 4 }, (_, i) => (
                                <div
                                    key={i}
                                    className="bg-theme-on-surface/8 h-14 animate-pulse rounded-md"
                                />
                            ))}
                            <span className="sr-only">Loading forms…</span>
                        </div>
                    ) : loadError && displayedForms.length === 0 ? (
                        <div className="text-theme-on-surface/80 col-span-full flex w-full flex-col items-center justify-center gap-2 py-8 text-center">
                            <h2 className="font-semibold">
                                Couldn&apos;t load forms
                            </h2>
                            <p role="alert" className="text-sm">
                                {loadError}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setFetchComplete(false);
                                    setRetryCount((c) => c + 1);
                                }}
                                className="bg-brand-depth/95 text-on-brand-depth mt-2 rounded-full px-4 py-2 text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    ) : displayedForms.length > 0 ? (
                        displayedForms.map((form) => (
                            <FormsView
                                key={form.id}
                                viewAsRow={viewAsRow}
                                form={form}
                                busy={busyId === form.id}
                                onDelete={() => void handleDelete(form.id)}
                                onDuplicate={() => void handleDuplicate(form.id)}
                            />
                        ))
                    ) : (
                        <div className="text-theme-on-surface/80 col-span-full flex w-full flex-col items-center justify-center gap-2 py-8 text-center">
                            <h2 className="font-semibold">
                                {isSearching
                                    ? 'No matching forms'
                                    : 'No forms yet'}
                            </h2>

                            <p>
                                {isSearching
                                    ? `Nothing matches “${query.trim()}”. Try a different search.`
                                    : 'Select a blank form or choose another template above to get started.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserForms;
