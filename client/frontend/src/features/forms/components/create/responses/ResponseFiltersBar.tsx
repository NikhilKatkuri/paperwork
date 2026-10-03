'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import type { ResponseFilters } from '../../../api/user/formResponses';
import type QuestionCore from '../../../types/question.type';

const CONTROL =
    'rounded-lg border border-theme-form-container-border/60 bg-theme-form-container text-sm text-theme-form-on-surface outline-none transition-colors placeholder:text-theme-form-on-surface/40 hover:border-theme-form-container-active/40 focus:border-theme-form-container-active';

interface ResponseFiltersProps {
    filters: ResponseFilters;
    questions: QuestionCore[];
    onChange: (next: ResponseFilters) => void;
}

/**
 * Search, sort and question filter.
 *
 * Typing is debounced so each keystroke does not fire a request. The search box
 * keeps local state and is reset by the parent remounting this component (via
 * its `key`) rather than by mirroring props into state inside an effect.
 */
export default function ResponseFiltersBar({
    filters,
    questions,
    onChange,
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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Outlined search field with a leading icon. */}
            <div className="relative flex-1 sm:min-w-60">
                <span className="material-symbols-outlined text-theme-form-on-surface/40 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                    search
                </span>
                <input
                    type="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Search answers or email"
                    aria-label="Search responses"
                    className={cn(CONTROL, 'w-full py-2.5 pr-3 pl-10')}
                />
            </div>

            <select
                value={filters.questionId ?? ''}
                onChange={(e) =>
                    onChange({
                        ...filters,
                        questionId: e.target.value || undefined,
                    })
                }
                aria-label="Filter by question"
                className={cn(CONTROL, 'py-2.5 sm:max-w-70 px-4')}
            >
                <option value="">All questions</option>
                {questions.map((question) => (
                    <option key={question._id} value={question._id}>
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
                className={cn(CONTROL, 'py-2.5 px-4')}
            >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
            </select>

            {hasFilters ? (
                <button
                    type="button"
                    // `filters` is the source of truth; clearing remounts this
                    // component via the parent's reset key.
                    onClick={() => {
                        setTerm('');
                        onChange({ sort: 'newest' });
                    }}
                    className="text-theme-form-on-surface/70 hover:bg-theme-form-on-surface/5 flex shrink-0 items-center gap-1 self-start rounded-lg px-2.5 py-2 text-xs transition-colors sm:self-auto"
                >
                    <span className="material-symbols-outlined text-base">
                        close
                    </span>
                    Clear
                </button>
            ) : null}
        </div>
    );
}
