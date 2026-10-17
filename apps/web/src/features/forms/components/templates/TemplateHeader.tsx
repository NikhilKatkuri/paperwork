'use client';
import Image from 'next/image';
import { RefObject } from 'react';

interface TemplateHeaderProps {
    query: string;
    setQuery: React.Dispatch<string>;
    searchRef: RefObject<HTMLInputElement | null>;
    hasTemplates: boolean;
}

function TemplateHeader({
    query,
    setQuery,
    searchRef,
    hasTemplates,
}: TemplateHeaderProps) {
    return (
        <header className="bg-theme-surface sticky top-0 z-50 mx-auto mt-0.5 flex w-full max-w-7xl flex-col items-center py-4">
            <div className="flex w-full items-center justify-between">
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
                <div className="ml-auto min-w-0">
                    <h1 className="text-theme-on-surface text-right text-lg font-semibold tracking-tight min-[44rem]:text-xl">
                        Template gallery
                    </h1>
                    <p className="text-theme-on-surface/55 hidden text-right text-xs min-[44rem]:block">
                        Start with a ready-made form and make it yours.
                    </p>
                </div>
            </div>

            <div className="w-full">
                {hasTemplates && (
                    <div className="group focus-within:ring-brand-light relative mt-4 flex h-11 w-full items-center overflow-hidden rounded-full bg-slate-100 px-4 transition-all focus-within:shadow-sm min-[44rem]:h-14">
                        <span className="material-symbols-outlined text-slate-500 select-none">
                            search
                        </span>
                        <input
                            ref={searchRef}
                            type="text"
                            inputMode="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setQuery('');
                                    event.currentTarget.blur();
                                }
                            }}
                            placeholder="Search templates or questions"
                            aria-label="Search templates"
                            className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                        {query ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    searchRef.current?.focus();
                                }}
                                aria-label="Clear search"
                                className="shrink-0 text-slate-500 transition-colors hover:text-slate-800"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    close
                                </span>
                            </button>
                        ) : (
                            <kbd
                                aria-hidden="true"
                                className="pointer-events-none hidden shrink-0 font-sans text-xs text-slate-400 select-none sm:block"
                            >
                                /
                            </kbd>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default TemplateHeader;
