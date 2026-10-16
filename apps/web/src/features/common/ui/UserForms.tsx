'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { cn } from '@/utils/cn';
import useGetForms from '@/features/forms/api/user/getAllForms';
import { uiPreferencesDB } from '@/features/user/components/lib/UiPreferences';
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

    // 1. Memoize options to ensure `next` function reference remains stable across renders
    const getFormsOptions = useMemo(() => ({ page: 1, limit: 20 }), []);

    const { loading, next } = useGetForms(getFormsOptions);

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

    useEffect(() => {
        let cancelled = false;

        async function fetchForms() {
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
                    toast.error(
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
    }, [next]);

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
                        <div className="text-theme-on-surface/60 col-span-full py-8 text-center">
                            Loading forms...
                        </div>
                    ) : displayedForms.length > 0 ? (
                        displayedForms.map((form) => (
                            <FormsView
                                key={form.id}
                                viewAsRow={viewAsRow}
                                form={form}
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
