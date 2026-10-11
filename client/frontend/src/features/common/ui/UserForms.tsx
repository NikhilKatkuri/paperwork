'use client';

import FormsView from '../../user/components/client/FormsView';
import ViewFormsHeader from '../../user/components/client/FormsHeader';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import useGetAllForms from '@/features/forms/api/user/allForms';
import { toast } from 'sonner';
import { FormDB } from '@/lib/db';
import { uiPreferencesDB } from '@/features/user/components/lib/UiPreferences';

interface UserFormsProps {
    /** Already debounced by the parent. */
    query?: string;
}

function UserForms({ query = '' }: Readonly<UserFormsProps>) {
    const [viewAsRow, setViewAsRow] = useState(true);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);

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

    function toggleView() {
        setViewAsRow((current) => !current);
    }

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

    const { loading, handler } = useGetAllForms();

    const [data, setData] = useState<FormDB[] | null>(null);

    const [sortMethod, setSortMethod] = useState<
        'plain' | 'alphabetical-forward' | 'alphabetical-reverse'
    >('plain');

    const displayedForms = useMemo(() => {
        const items = (data ?? []).filter((form) =>
            (form.name ?? '').toLowerCase().includes(query.trim().toLowerCase())
        );

        if (sortMethod === 'plain') {
            items.sort(
                (a, b) =>
                    new Date(b.updatedAt!).getTime() -
                    new Date(a.updatedAt!).getTime()
            );
        } else if (sortMethod === 'alphabetical-forward') {
            items.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            items.sort((a, b) => b.name.localeCompare(a.name));
        }

        return items;
    }, [data, query, sortMethod]);

    function sort() {
        setSortMethod((current) =>
            current === 'plain' || current === 'alphabetical-reverse'
                ? 'alphabetical-forward'
                : 'alphabetical-reverse'
        );
    }

    /**
     * StrictMode mounts, unmounts, then remounts this effect in dev. The first
     * request is aborted rather than merely ignored, so its result can never be
     * discarded after the remount - and no `loaded` ref is needed to suppress
     * the second call, which is what would otherwise strand `data` at null.
     */
    useEffect(() => {
        const controller = new AbortController();

        handler(controller.signal)
            .then((forms) => setData(forms))
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                toast.error(
                    e instanceof Error ? e.message : 'Failed to load forms'
                );
            });

        return () => controller.abort();
    }, [handler]);

    /**
     * Filtered locally: every page of forms is already fetched and cached, so
     * this covers the whole list without another round-trip.
     */
    const filtered = useMemo(() => {
        const all = data ?? [];
        const term = query.trim().toLowerCase();

        if (!term) return all;

        return all.filter((form) =>
            (form.name ?? '').toLowerCase().includes(term)
        );
    }, [data, query]);

    const isSearching = query.trim().length > 0;

    return (
        <>
            <ViewFormsHeader
                viewAsRow={viewAsRow}
                setViewAsRow={toggleView}
                sort={sort}
            />
            {isSearching && data && data.length > 0 ? (
                <p className="text-theme-on-surface/60 mt-4 text-xs">
                    {filtered.length} of {data.length}{' '}
                    {data.length === 1 ? 'form' : 'forms'} match
                </p>
            ) : null}

            <div className="mt-5 h-auto flex-1">
                <div
                    className={cn(
                        'grid',
                        viewAsRow
                            ? ''
                            : 'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                    )}
                >
                    {/* Nothing rendered while loading - otherwise the empty
                        state flashes before the first response lands. */}
                    {!loading && displayedForms.length > 0 ? (
                        displayedForms.map((form) => (
                            <FormsView
                                key={form._id}
                                viewAsRow={viewAsRow}
                                form={form}
                            />
                        ))
                    ) : (
                        <div className="text-theme-on-surface/80 flex h-full w-full flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                            <h1 className="font-semibold">
                                {isSearching
                                    ? 'No matching forms'
                                    : 'No forms yet'}
                            </h1>
                            <p>
                                {isSearching
                                    ? `Nothing matches “${query.trim()}”. Try a different search.`
                                    : 'Select a blank form or choose another template above to get started'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserForms;
