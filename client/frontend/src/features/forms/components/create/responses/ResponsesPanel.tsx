'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import ResponseDetail from './ResponseDetail';
import ResponseFiltersBar from './ResponseFiltersBar';
import SummaryView from './SummaryView';
import {
    RESPONSE_PAGE_SIZES,
    useFormResponses,
    useResponseSummary,
    type ResponseFilters,
} from '../../../api/user/formResponses';
import type { FormResponse } from '../../../types/response.type';
import { useFormCreate } from '../../../providers/FormCreate';

type ViewMode = 'list' | 'summary';

/** "just now", "12m ago", "3 Mar" - friendlier than an absolute timestamp. */
function relativeTime(value: string | number): string {
    const then = new Date(value).getTime();

    if (Number.isNaN(then)) return '-';

    const seconds = Math.round((Date.now() - then) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(then).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

function initials(source: string): string {
    const cleaned = source.replace(/@.*$/, '').replace(/[^a-zA-Z0-9]/g, ' ');

    if (!cleaned.trim()) return '?';

    return cleaned
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function Pagination({
    page,
    totalPages,
    total,
    limit,
    disabled,
    onPage,
    onLimit,
}: Readonly<{
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    disabled: boolean;
    onPage: (page: number) => void;
    onLimit: (limit: number) => void;
}>) {
    const pages = useMemo(() => {
        const span = 1;
        const start = Math.max(1, page - span);
        const end = Math.min(totalPages, page + span);

        return Array.from(
            { length: Math.max(0, end - start + 1) },
            (_, i) => start + i
        );
    }, [page, totalPages]);

    const iconButton =
        'grid h-9 w-9 place-items-center rounded-full border border-transparent text-sm transition-colors hover:bg-theme-form-on-surface/5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

    return (
        <nav
            aria-label="Response pages"
            className="border-theme-form-container-border/50 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row"
        >
            <label className="text-theme-form-on-surface/70 flex items-center gap-2 text-xs">
                Rows
                <select
                    value={limit}
                    disabled={disabled}
                    onChange={(e) => onLimit(Number(e.target.value))}
                    className="border-theme-form-container-border/60 rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none disabled:opacity-40"
                >
                    {RESPONSE_PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </label>

            {total > 0 ? (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPage(page - 1)}
                        disabled={disabled || page <= 1}
                        aria-label="Previous page"
                        className={iconButton}
                    >
                        <span className="material-symbols-outlined text-lg">
                            chevron_left
                        </span>
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPage(p)}
                            disabled={disabled}
                            aria-current={p === page ? 'page' : undefined}
                            className={cn(
                                'grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm tabular-nums transition-colors',
                                'hover:bg-theme-form-on-surface/5',
                                p === page &&
                                    'bg-theme-form-container-active text-theme-form-on-active'
                            )}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => onPage(page + 1)}
                        disabled={disabled || page >= totalPages}
                        aria-label="Next page"
                        className={iconButton}
                    >
                        <span className="material-symbols-outlined text-lg">
                            chevron_right
                        </span>
                    </button>
                </div>
            ) : null}

            <p className="text-theme-form-on-surface/60 text-xs tabular-nums">
                {total === 0
                    ? 'No responses'
                    : `${(page - 1) * limit + 1}–${Math.min(
                          page * limit,
                          total
                      )} of ${total}`}
            </p>
        </nav>
    );
}

export default function ResponsesPanel() {
    const { activeFormID, questions: questionMap } = useFormCreate();

    const [mode, setMode] = useState<ViewMode>('list');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState<number>(RESPONSE_PAGE_SIZES[1]);
    const [filters, setFilters] = useState<ResponseFilters>({
        sort: 'newest',
    });
    const [detail, setDetail] = useState<FormResponse | null>(null);

    const questions = useMemo(() => [...questionMap.values()], [questionMap]);
    const formId = activeFormID ?? undefined;

    const { responses, pagination, loading, error } = useFormResponses(
        formId,
        page,
        limit,
        filters
    );

    const {
        summary,
        loading: summaryLoading,
        error: summaryError,
    } = useResponseSummary(formId, filters);

    const total = pagination?.total ?? 0;

    const applyFilters = useCallback((next: ResponseFilters) => {
        setFilters(next);
        setPage(1);
    }, []);

    const byId = useMemo(
        () => new Map(questions.map((q) => [q._id, q])),
        [questions]
    );

    if (!activeFormID) {
        return (
            <p className="text-theme-form-on-surface/70 p-6 text-sm">
                Open a form to see its responses.
            </p>
        );
    }

    const showSkeleton = loading && responses.length === 0;
    const filtering = Boolean(filters.q || filters.questionId);

    return (
        <div className="mx-auto flex h-full w-full max-w-4xl bg-white my-2 rounded-lg scrollbar-none flex-col gap-4 overflow-y-auto px-4 py-6 md:p-6">
            {/* Header: title, count, and the view switch */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-theme-form-on-surface text-lg font-semibold">
                        Responses
                    </h2>
                    <span className="bg-theme-form-on-surface/8 text-theme-form-on-surface/70 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                        {loading && !total ? '–' : total}
                    </span>
                </div>

                <div
                    role="tablist"
                    aria-label="Response view"
                    className="border-theme-form-container-border/60 flex rounded-full border p-0.5"
                >
                    {(
                        [
                            { id: 'list', label: 'Responses', icon: 'list' },
                            {
                                id: 'summary',
                                label: 'Summary',
                                icon: 'bar_chart',
                            },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            type="button"
                            aria-selected={mode === tab.id}
                            onClick={() => setMode(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                                mode === tab.id
                                    ? 'bg-theme-form-container-active text-theme-form-on-active'
                                    : 'text-theme-form-on-surface/70 hover:text-theme-form-on-surface'
                            )}
                        >
                            <span className="material-symbols-outlined text-base">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <ResponseFiltersBar
                filters={filters}
                questions={questions}
                onChange={applyFilters}
            />

            {mode === 'summary' ? (
                summaryError ? (
                    <p className="text-sm text-red-500">{summaryError}</p>
                ) : (
                    <SummaryView
                        summary={summary}
                        questions={questions}
                        loading={summaryLoading}
                        totalResponses={summary?.totalResponses ?? 0}
                    />
                )
            ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : showSkeleton ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-theme-form-on-surface/8 h-20 animate-pulse rounded-xl"
                        />
                    ))}
                </div>
            ) : responses.length === 0 ? (
                <div className="border-theme-form-container-border/60 flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
                    <span className="material-symbols-outlined text-theme-form-on-surface/30 text-3xl">
                        {filtering ? 'filter_alt_off' : 'inbox'}
                    </span>
                    <p className="text-theme-form-on-surface text-sm font-medium">
                        {filtering
                            ? 'No matching responses'
                            : 'No responses yet'}
                    </p>
                    <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                        {filtering
                            ? 'Try a different search term, or clear the filters.'
                            : 'Responses appear here as soon as someone fills in the form.'}
                    </p>
                </div>
            ) : (
                <>
                    {/*
                     * One list layout for every screen width. A table gave every
                     * row a different height, because each cell held the whole
                     * answer list, and needed a separate card variant on
                     * mobile. Each entry shows a short preview instead, with the
                     * full set one click away.
                     */}
                    <ul
                        className={cn(
                            'flex flex-col gap-2 transition-opacity',
                            loading && 'opacity-60'
                        )}
                    >
                        {responses.map((response: FormResponse, index) => {
                            const respondent =
                                response.email || response.userId;
                            const preview = response.answers
                                .slice(0, 2)
                                .map((answer) => {
                                    const label = byId
                                        .get(answer.questionId)
                                        ?.question.replace(/<[^>]*>/g, ' ')
                                        .trim();

                                    return `${label ?? 'Question'}: ${answer.values
                                        .filter((v) => v.trim())
                                        .join(', ')}`;
                                })
                                .filter(Boolean)
                                .join('  ·  ');

                            return (
                                <li key={response._id}>
                                    <button
                                        type="button"
                                        onClick={() => setDetail(response)}
                                        className="hover:border-theme-form-container-active/40 focus-visible:border-theme-form-container-active/40 group border-theme-form-container-border/50 bg-theme-form-container flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="bg-theme-form-container-active/12 text-theme-form-container-active grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                                        >
                                            {initials(respondent)}
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline justify-between gap-3">
                                                <span className="text-theme-form-on-surface truncate text-sm font-medium">
                                                    {respondent}
                                                </span>
                                                <span className="text-theme-form-on-surface/50 shrink-0 text-xs tabular-nums">
                                                    {relativeTime(
                                                        response.createdAt
                                                    )}
                                                </span>
                                            </span>

                                            <span className="text-theme-form-on-surface/70 mt-0.5 line-clamp-2 block text-xs">
                                                {preview || 'No answers given'}
                                            </span>

                                            <span className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span className="bg-theme-form-on-surface/8 text-theme-form-on-surface/60 rounded-md px-1.5 py-0.5 text-[11px]">
                                                    #
                                                    {(page - 1) * limit +
                                                        index +
                                                        1}
                                                </span>
                                                <span className="bg-theme-form-on-surface/8 text-theme-form-on-surface/60 rounded-md px-1.5 py-0.5 text-[11px]">
                                                    {response.answers.length}{' '}
                                                    answered
                                                </span>
                                            </span>
                                        </span>

                                        <span className="material-symbols-outlined text-theme-form-on-surface/30 mt-1 shrink-0 text-lg transition-transform group-hover:translate-x-0.5">
                                            chevron_right
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <Pagination
                        page={page}
                        totalPages={pagination?.totalPages ?? 0}
                        total={total}
                        limit={limit}
                        disabled={loading}
                        onPage={setPage}
                        onLimit={(next) => {
                            setLimit(next);
                            setPage(1);
                        }}
                    />
                </>
            )}

            <ResponseDetail
                response={detail}
                questions={questions}
                onClose={() => setDetail(null)}
            />
        </div>
    );
}
