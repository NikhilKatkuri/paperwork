'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import {
    useEnsureForm,
    useFormSearch,
} from '@/features/forms/api/user/formSearch';

interface UserHeaderProps {
    query: string;
    onQueryChange: (value: string) => void;
}

function UserHeader({ query, onQueryChange }: Readonly<UserHeaderProps>) {
    const router = useRouter();

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    // The server is queried with the trimmed term, so only ask once there is
    // something to look for.
    const searchTerm = query.trim();
    const { hits, loading } = useFormSearch(searchTerm);
    const { ensureForm, loadingId } = useEnsureForm();

    /**
     * Ctrl/Cmd+K focuses the box from anywhere on the page; Escape clears and
     * releases it. Bound on the document because the header is not focused when
     * the shortcut is pressed.
     */
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                event.key?.toLowerCase() === 'k' &&
                (event.metaKey || event.ctrlKey)
            ) {
                event.preventDefault();
                setOpen(true);
                inputRef.current?.focus();
                inputRef.current?.select();
                return;
            }

            if (
                event.key === 'Escape' &&
                document.activeElement === inputRef.current
            ) {
                event.preventDefault();
                setOpen(false);
                onQueryChange('');
                inputRef.current?.blur();
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onQueryChange]);

    // Close when focus or a click lands outside the search area.
    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            if (!wrapRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    // Clamped during render so a shrinking result list cannot leave the
    // highlight pointing past the end.
    const activeIndex = hits.length ? Math.min(active, hits.length - 1) : 0;

    const select = useCallback(
        async (formId: string) => {
            setOpen(false);

            const loaded = await ensureForm(formId);

            // Only navigate once the local cache holds the form, otherwise the
            // editor would mount against whatever was cached before.
            if (loaded) router.push(`/forms/c/${formId}`);
        },
        [ensureForm, router]
    );

    function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!open) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((i) => (hits.length ? (i + 1) % hits.length : 0));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((i) =>
                hits.length ? (i - 1 + hits.length) % hits.length : 0
            );
            return;
        }

        if (event.key === 'Enter') {
            const hit = hits[activeIndex];

            if (hit) {
                event.preventDefault();
                void select(hit._id);
            }
        }
    }

    const showResults = open && searchTerm.length > 0;

    return (
        <header className="bg-theme-surface sticky top-0 z-50 flex w-full items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2">
                <Image
                    src="/paperwork_icon-vector-master.svg"
                    alt="Paperwork Icon"
                    height={32}
                    width={32}
                    className="h-6 w-6 min-[44rem]:h-8 min-[44rem]:w-8"
                />
                <p className="w-36 text-left text-lg font-medium max-[44rem]:hidden">
                    Paperwork
                </p>
            </div>

            <div ref={wrapRef} className="relative w-full">
                <label
                    htmlFor="search-input"
                    className="group focus-within:ring-brand-light flex h-10 w-full cursor-text items-center overflow-hidden rounded-full bg-slate-100 px-4 transition-all focus-within:shadow-sm min-[44rem]:h-14"
                >
                    <div className="group-focus-within:text-brand-light flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-theme-on-surface select-none">
                            search
                        </span>
                    </div>
                    <input
                        ref={inputRef}
                        id="search-input"
                        name="search-input"
                        type="text"
                        role="combobox"
                        aria-expanded={showResults}
                        aria-controls="search-results"
                        aria-autocomplete="list"
                        aria-activedescendant={
                            showResults && hits[activeIndex]
                                ? `search-hit-${hits[activeIndex]._id}`
                                : undefined
                        }
                        value={query}
                        onChange={(e) => {
                            // Reset the highlight for the new result set.
                            setActive(0);
                            onQueryChange(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onInputKeyDown}
                        placeholder="Search forms"
                        aria-label="Search forms"
                        className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    {query ? (
                        <button
                            type="button"
                            onClick={() => {
                                onQueryChange('');
                                setOpen(false);
                                inputRef.current?.focus();
                            }}
                            aria-label="Clear search"
                            className="shrink-0 text-slate-500 transition-colors hover:text-slate-800"
                        >
                            <span className="material-symbols-outlined text-lg">
                                close
                            </span>
                        </button>
                    ) : (
                        // Decorative hint - never announced, since the shortcut
                        // works without reading it.
                        <kbd className="pointer-events-none hidden shrink-0 font-sans text-xs text-slate-400 select-none sm:block">
                            Ctrl K
                        </kbd>
                    )}
                </label>

                {showResults ? (
                    <div
                        id="search-results"
                        role="listbox"
                        aria-label="Form search results"
                        className="bg-theme-surface border-theme-form-container-border/60 absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg"
                    >
                        {loading && hits.length === 0 ? (
                            <p className="text-theme-on-surface/60 px-4 py-3 text-sm">
                                Searching…
                            </p>
                        ) : hits.length === 0 ? (
                            <p className="text-theme-on-surface/60 px-4 py-3 text-sm">
                                No forms match “{searchTerm}”
                            </p>
                        ) : (
                            <ul className="max-h-80 overflow-y-auto py-1">
                                {hits.map((hit, index) => (
                                    <li key={hit._id}>
                                        <button
                                            id={`search-hit-${hit._id}`}
                                            role="option"
                                            aria-selected={
                                                index === activeIndex
                                            }
                                            type="button"
                                            disabled={loadingId === hit._id}
                                            onMouseEnter={() =>
                                                setActive(index)
                                            }
                                            onClick={() => void select(hit._id)}
                                            className={cn(
                                                'hover:bg-theme-form-on-surface/5 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                                index === activeIndex &&
                                                    'bg-theme-form-on-surface/5',
                                                loadingId === hit._id &&
                                                    'opacity-60'
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-theme-on-surface/50 text-lg">
                                                description
                                            </span>
                                            <span className="text-theme-form-on-surface min-w-0 flex-1 truncate text-sm">
                                                {hit.name?.trim() ||
                                                    'Untitled form'}
                                            </span>
                                            <span className="material-symbols-outlined text-theme-on-surface/40 text-base">
                                                arrow_forward
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : null}
            </div>
        </header>
    );
}

export default UserHeader;
