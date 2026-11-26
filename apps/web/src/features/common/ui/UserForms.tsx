'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { cn } from '@/utils/cn';
import useGetForms from '@/features/forms/api/user/getAllForms';
import { useEnsureForm } from '@/features/forms/api/user/formSearch';
import { uiPreferencesDB } from '@/features/user/components/lib/UiPreferences';
import formRepository from '@/features/forms/repositories/formRepository';
import { endpoints } from '@/api/endpoints';
import { ApiError, http } from '@/api/http';
import {
    moveFormsToBin,
    unpublishForms,
} from '@/features/forms/api/user/formBin';
import type { FormDB } from '@/types';

interface UserFormsProps {
    /** Already debounced by the parent. */
    query?: string;
}

type SortMethod = 'plain' | 'alphabetical-forward' | 'alphabetical-reverse';

/**
 * How long a visitor must stay on the page before the server list is fetched.
 * The IndexedDB snapshot renders immediately, so a quick bounce never costs a
 * network round trip; a visitor who lingers gets a background refresh.
 */
const SERVER_REFRESH_DELAY_MS = 5000;

function UserForms({ query = '' }: Readonly<UserFormsProps>) {
    const [viewAsRow, setViewAsRow] = useState(true);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);
    const [data, setData] = useState<FormDB[]>([]);
    const [sortMethod, setSortMethod] = useState<SortMethod>('plain');
    const [fetchComplete, setFetchComplete] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);
    // Bumped whenever the page resumes (bfcache restore, tab focus, or a
    // client-side return to this route) so the local snapshot is re-read
    // without waiting for a full reload.
    const [resumeKey, setResumeKey] = useState(0);

    // 1. Memoize options to ensure `next` function reference remains stable across renders
    const getFormsOptions = useMemo(() => ({ page: 1, limit: 20 }), []);

    const { next } = useGetForms(getFormsOptions);
    const { ensureForm } = useEnsureForm();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [binCount, setBinCount] = useState(0);

    useEffect(() => {
        let alive = true;

        void Promise.resolve()
            .then(() => formRepository.getTrashed())
            .then((trashed) => {
                if (alive) setBinCount(trashed.length);
            })
            .catch(() => undefined);

        return () => {
            alive = false;
        };
    }, [resumeKey]);

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
            const result = await moveFormsToBin([formId]);
            if (result.errors.length) throw new Error(result.errors[0]);
            setData((prev) => prev.filter((f) => f.id !== formId));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(formId);
                return next;
            });
            setBinCount((count) => count + 1);
            toast.success('Form moved to bin');
        } catch (error) {
            toast.error(
                error instanceof ApiError || error instanceof Error
                    ? error.message
                    : 'Failed to move form to bin'
            );
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleUnpublish = useCallback(async (formId: string) => {
        setBusyId(formId);
        try {
            const result = await unpublishForms([formId]);
            if (result.errors.length) throw new Error(result.errors[0]);
            setData((prev) =>
                prev.map((form) =>
                    form.id === formId ? { ...form, isPublished: false } : form
                )
            );
            toast.success('Form unpublished');
        } catch (error) {
            toast.error(
                error instanceof ApiError || error instanceof Error
                    ? error.message
                    : 'Failed to unpublish form'
            );
        } finally {
            setBusyId(null);
        }
    }, []);

    const toggleSelected = useCallback((formId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(formId)) next.delete(formId);
            else next.add(formId);
            return next;
        });
    }, []);

    const activateSelection = useCallback((formId: string) => {
        setSelectionMode(true);
        setSelectedIds(new Set([formId]));
    }, []);

    const exitSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleBulkMoveToBin = useCallback(async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;

        setBulkBusy(true);
        try {
            const result = await moveFormsToBin(ids);
            if (result.changed.length) {
                const changed = new Set(result.changed);
                setData((prev) => prev.filter((form) => !changed.has(form.id)));
                setSelectedIds(new Set());
                setBinCount((count) => count + result.changed.length);
                toast.success(
                    `${result.changed.length} form${result.changed.length === 1 ? '' : 's'} moved to bin`
                );
            }
            if (result.errors.length) {
                toast.error(result.errors[0]);
            }
        } finally {
            setBulkBusy(false);
            setSelectionMode(false);
        }
    }, [selectedIds]);

    const handleBulkUnpublish = useCallback(async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;

        setBulkBusy(true);
        try {
            const result = await unpublishForms(ids);
            if (result.changed.length) {
                const changed = new Set(result.changed);
                setData((prev) =>
                    prev.map((form) =>
                        changed.has(form.id)
                            ? { ...form, isPublished: false }
                            : form
                    )
                );
                toast.success(
                    `${result.changed.length} form${result.changed.length === 1 ? '' : 's'} unpublished`
                );
            }
            if (result.errors.length) {
                toast.error(result.errors[0]);
            }
        } finally {
            setBulkBusy(false);
            setSelectionMode(false);
        }
    }, [selectedIds]);

    const handleDuplicate = useCallback(
        async (formId: string) => {
            setBusyId(formId);
            try {
                const res = await http.post<{
                    form: { id?: string; _id?: string };
                }>(endpoints.forms.duplicateForm(formId), {});
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

    /**
     * Creating a form navigates with a full document load, so coming back is
     * a bfcache restore: mounted effects do not re-run and the list would
     * show the pre-creation snapshot until a manual reload. Re-sync whenever
     * the page becomes visible again.
     */
    const pathname = usePathname();
    const isHome = pathname === '/user' || pathname === '/forms';
    const wasHomeRef = useRef(isHome);

    // A client-side return to this route must re-sync as well in case the
    // router preserved the mounted tree instead of remounting it.
    useEffect(() => {
        if (isHome && !wasHomeRef.current) {
            setResumeKey((k) => k + 1);
        }

        wasHomeRef.current = isHome;
    }, [isHome]);

    useEffect(() => {
        function resume() {
            setResumeKey((k) => k + 1);
        }

        function onPageShow(event: PageTransitionEvent) {
            if (event.persisted) resume();
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'visible') resume();
        }

        window.addEventListener('pageshow', onPageShow);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('pageshow', onPageShow);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange
            );
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadCachedForms() {
            try {
                const cached = await formRepository.getAll();

                if (!cancelled && cached.length > 0) {
                    setData(cached);
                }
            } catch {
                // A cache miss must not block the server refresh below.
            }
        }

        void loadCachedForms();

        return () => {
            cancelled = true;
        };
    }, [resumeKey]);

    useEffect(() => {
        let cancelled = false;

        // First paint is served from IndexedDB; only a visitor who stays long
        // enough triggers the network. Explicit retries skip the delay.
        const delay = retryCount === 0 ? SERVER_REFRESH_DELAY_MS : 0;

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

                    // Record the server projection so the next cold load can
                    // render without touching the network.
                    await formRepository
                        .seedMany(allForms)
                        .catch(() => undefined);
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

        const timer = setTimeout(() => void fetchForms(), delay);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [next, retryCount, resumeKey]);

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

    const allDisplayedSelected =
        displayedForms.length > 0 &&
        displayedForms.every((form) => selectedIds.has(form.id));

    const toggleSelectAll = useCallback(() => {
        setSelectionMode(true);
        setSelectedIds((prev) => {
            if (
                displayedForms.length > 0 &&
                displayedForms.every((form) => prev.has(form.id))
            ) {
                return new Set();
            }
            return new Set(displayedForms.map((form) => form.id));
        });
    }, [displayedForms]);

    const isSearching = query.trim().length > 0;
    // Cached rows stay visible while the delayed server refresh runs; the
    // skeleton only covers the window where there is nothing to render.
    const isLoading = data.length === 0 && !fetchComplete;

    return (
        <>
            <ViewFormsHeader
                viewAsRow={viewAsRow}
                setViewAsRow={toggleView}
                sort={sort}
            />

            <div className="mt-2 flex min-h-10 items-center justify-between gap-2 px-1">
                <p className="text-theme-on-surface/60 text-xs">
                    Long press a form to select it
                </p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        disabled={displayedForms.length === 0}
                        className="text-theme-on-surface/70 hover:bg-brand-light/60 hover:text-theme-on-surface rounded-full px-3 py-2 text-xs disabled:opacity-50"
                    >
                        {allDisplayedSelected ? 'Deselect all' : 'Select all'}
                    </button>
                    <Link
                        href="/user/bin"
                        title="Open bin"
                        aria-label={`Open bin${binCount > 0 ? `, ${binCount} form${binCount === 1 ? '' : 's'}` : ''}`}
                        className="hover:bg-brand-light/60 text-theme-on-surface/70 hover:text-theme-on-surface relative flex aspect-square h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
                    >
                        <span className="material-symbols-outlined text-xl">
                            delete
                        </span>
                        {binCount > 0 && (
                            <span className="bg-brand-depth text-on-brand-depth absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
                                {binCount > 9 ? '9+' : binCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {selectionMode && (
                <div className="bg-theme-surface mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <p className="text-sm font-medium">
                        {selectedIds.size} form
                        {selectedIds.size === 1 ? '' : 's'} selected
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleBulkUnpublish()}
                            disabled={bulkBusy}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                            Unpublish
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleBulkMoveToBin()}
                            disabled={bulkBusy}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                            {bulkBusy ? 'Working…' : 'Move to bin'}
                        </button>
                        <button
                            type="button"
                            onClick={exitSelection}
                            disabled={bulkBusy}
                            className="text-theme-on-surface/70 flex items-center gap-1 px-2 py-1.5 text-sm disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-base">
                                close
                            </span>
                            Done
                        </button>
                    </div>
                </div>
            )}

            {isSearching && data.length > 0 && (
                <p className="text-theme-on-surface/60 mt-4 text-xs">
                    {displayedForms.length} of {data.length}{' '}
                    {data.length === 1 ? 'form' : 'forms'} match
                </p>
            )}

            <div className="mt-5 h-auto flex-1 pb-24">
                <div
                    className={cn(
                        'grid',
                        viewAsRow
                            ? 'w-full'
                            : 'grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
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
                                selected={selectedIds.has(form.id)}
                                selectionMode={selectionMode}
                                onLongPress={activateSelection}
                                onSelect={() => toggleSelected(form.id)}
                                onDelete={() => void handleDelete(form.id)}
                                onDuplicate={() =>
                                    void handleDuplicate(form.id)
                                }
                                onUnpublish={() =>
                                    void handleUnpublish(form.id)
                                }
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
