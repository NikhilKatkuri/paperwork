'use client';

import { RefObject, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import type { ResponseFilters } from '../../../api/user/formResponses';
import { QuestionDoc } from '@paperwork/types';

const SELECT_CONTROL =
    'border-theme-on-surface/15 bg-theme-surface text-theme-on-surface hover:bg-theme-surface-hover focus-visible:ring-brand rounded-md border text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2';

interface ResponseFiltersProps {
    filters: ResponseFilters;
    questions: QuestionDoc[];
    onChange: (next: ResponseFilters) => void;
    searchRef?: RefObject<HTMLInputElement | null>;
}

export default function ResponseFiltersBar({
    filters,
    questions,
    onChange,
    searchRef,
}: Readonly<ResponseFiltersProps>) {
    const [term, setTerm] = useState(filters.q ?? '');

    useEffect(() => {
        const next = term.trim();
        if ((filters.q ?? '') === next) return;

        const timer = setTimeout(() => {
            onChange({ ...filters, q: next || undefined });
        }, 350);

        return () => clearTimeout(timer);
    }, [term, filters, onChange]);

    const hasFilters = Boolean(filters.q || filters.questionId);

    return (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Pill search bar matching TemplateHeader */}
            <div className="group focus-within:ring-brand-light relative flex h-11 flex-1 items-center overflow-hidden rounded-full bg-slate-100 px-4 transition-all focus-within:ring-2">
                <span className="material-symbols-outlined text-[18px] text-slate-500 select-none">
                    search
                </span>
                <input
                    ref={searchRef}
                    type="text"
                    inputMode="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setTerm('');
                            e.currentTarget.blur();
                        }
                    }}
                    placeholder="Search answers or respondent email"
                    aria-label="Search responses"
                    className="w-full bg-transparent px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                {term ? (
                    <button
                        type="button"
                        onClick={() => {
                            setTerm('');
                            searchRef?.current?.focus();
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

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={filters.questionId ?? ''}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            questionId: e.target.value || undefined,
                        })
                    }
                    aria-label="Filter by question"
                    className={cn(SELECT_CONTROL, 'h-10 max-w-56 px-3')}
                >
                    <option value="">All questions</option>
                    {questions.map((question) => (
                        <option key={question.id} value={question.id}>
                            {question.question.replace(/<[^>]*>/g, ' ').trim()}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.sort ?? 'newest'}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            sort: e.target.value as 'newest' | 'oldest',
                        })
                    }
                    aria-label="Sort responses"
                    className={cn(SELECT_CONTROL, 'h-10 px-3')}
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                </select>

                {hasFilters ? (
                    <button
                        type="button"
                        onClick={() => {
                            setTerm('');
                            onChange({ sort: 'newest' });
                        }}
                        className="text-theme-on-surface/65 hover:bg-theme-surface-hover hover:text-theme-on-surface flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">
                            close
                        </span>
                        Reset
                    </button>
                ) : null}
            </div>
        </div>
    );
}
