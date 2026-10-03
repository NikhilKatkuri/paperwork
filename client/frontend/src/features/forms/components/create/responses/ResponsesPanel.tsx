'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import AnswerValue from './AnswerValue';
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

function formatDate(value: string | number): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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
        // A short window around the current page, with the ends reachable.
        const span = 2;
        const start = Math.max(1, page - span);
        const end = Math.min(totalPages, page + span);

        return Array.from(
            { length: Math.max(0, end - start + 1) },
            (_, i) => start + i
        );
    }, [page, totalPages]);

    const button =
        'rounded-md border border-theme-form-on-surface/25 px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-theme-form-on-surface/5 disabled:hover:bg-transparent';

    return (
        <div className="border-theme-form-container-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-theme-form-on-surface/70 text-xs tabular-nums">
                {total === 0
                    ? 'No responses'
                    : `Showing ${(page - 1) * limit + 1}–${Math.min(
                          page * limit,
                          total
                      )} of ${total}`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <label className="text-theme-form-on-surface/70 flex items-center gap-2 text-xs">
                    Rows
                    <select
                        value={limit}
                        disabled={disabled}
                        onChange={(e) => onLimit(Number(e.target.value))}
                        className="border-theme-form-on-surface/30 text-theme-form-on-surface rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none disabled:opacity-40"
                    >
                        {RESPONSE_PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="button"
                    onClick={() => onPage(page - 1)}
                    disabled={disabled || page <= 1}
                    className={button}
                >
                    Prev
                </button>

                {pages.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onPage(p)}
                        disabled={disabled}
                        aria-current={p === page ? 'page' : undefined}
                        className={cn(
                            button,
                            p === page &&
                                'bg-theme-form-container-active border-theme-form-container-active text-white'
                        )}
                    >
                        {p}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPage(page + 1)}
                    disabled={disabled || page >= totalPages}
                    className={button}
                >
                    Next
                </button>
            </div>
        </div>
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
    const totalPages = pagination?.totalPages ?? 0;

    // Any filter change can leave the current page out of range.
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

    const answeredBy = (questionId: string) =>
        summary?.questions.find((q) => q.questionId === questionId)?.answered ??
        0;

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl scrollbar-none flex-col gap-4 overflow-y-auto px-4 py-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-theme-form-on-surface text-lg font-semibold">
                        Responses
                    </h2>
                    <p className="text-theme-form-on-surface/60 text-xs tabular-nums">
                        {loading
                            ? 'Loading…'
                            : `${total} submitted${total === 1 ? '' : 's'}`}
                    </p>
                </div>

                <div
                    role="tablist"
                    aria-label="Response view"
                    className="border-theme-form-container-border/60 bg-theme-form-on-surface/5 flex rounded-md border p-0.5"
                >
                    {(['list', 'summary'] as ViewMode[]).map((value) => (
                        <button
                            key={value}
                            role="tab"
                            type="button"
                            aria-selected={mode === value}
                            onClick={() => setMode(value)}
                            className={cn(
                                'rounded-sm px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                                mode === value
                                    ? 'bg-theme-form-container-active text-white'
                                    : 'text-theme-form-on-surface/70 hover:text-theme-form-on-surface'
                            )}
                        >
                            {value}
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
            ) : loading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-theme-form-on-surface/10 h-16 animate-pulse rounded-md"
                        />
                    ))}
                </div>
            ) : responses.length === 0 ? (
                <div className="border-theme-form-container-border/60 flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-center">
                    <span className="material-symbols-outlined text-3xl opacity-40">
                        {filters.q || filters.questionId
                            ? 'filter_alt_off'
                            : 'inbox'}
                    </span>
                    <p className="text-theme-form-on-surface text-sm font-medium">
                        {filters.q || filters.questionId
                            ? 'No responses match those filters'
                            : 'No responses yet'}
                    </p>
                    <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                        {filters.q || filters.questionId
                            ? 'Try a different search or clear the filters.'
                            : 'Responses appear here once someone fills the form.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop: table. Phones: cards, since the table is unusable at that width. */}
                    <div className="border-theme-form-container-border/60 hidden overflow-hidden rounded-md border md:block">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-theme-form-container-border/60 bg-theme-form-on-surface/5 text-xs">
                                    <th className="w-12 px-3 py-2 font-medium">
                                        #
                                    </th>
                                    <th className="w-40 px-3 py-2 font-medium">
                                        Submitted
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Respondent
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Answers
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map(
                                    (response: FormResponse, index) => (
                                        <tr
                                            key={response._id}
                                            onClick={() => setDetail(response)}
                                            className="border-theme-form-container-border/40 hover:bg-theme-form-on-surface/5 cursor-pointer border-b transition-colors last:border-b-0"
                                        >
                                            <td className="text-theme-form-on-surface/50 px-3 py-2.5 align-top text-xs tabular-nums">
                                                {(page - 1) * limit + index + 1}
                                            </td>
                                            <td className="text-theme-form-on-surface/80 px-3 py-2.5 align-top text-xs whitespace-nowrap">
                                                {formatDate(response.createdAt)}
                                            </td>
                                            <td className="max-w-[180px] truncate px-3 py-2.5 align-top text-xs">
                                                {response.email ||
                                                    response.userId}
                                            </td>
                                            <td className="px-3 py-2.5 align-top">
                                                <ul className="flex flex-col gap-1.5">
                                                    {response.answers.map(
                                                        (answer) => (
                                                            <li
                                                                key={
                                                                    answer.questionId
                                                                }
                                                                className="text-xs"
                                                            >
                                                                <span className="text-theme-form-on-surface/55">
                                                                    {byId
                                                                        .get(
                                                                            answer.questionId
                                                                        )
                                                                        ?.question.replace(
                                                                            /<[^>]*>/g,
                                                                            ' '
                                                                        ) ??
                                                                        'Deleted question'}
                                                                    :
                                                                </span>{' '}
                                                                <AnswerValue
                                                                    values={
                                                                        answer.values
                                                                    }
                                                                    question={byId.get(
                                                                        answer.questionId
                                                                    )}
                                                                />
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-2 md:hidden">
                        {responses.map((response: FormResponse, index) => (
                            <button
                                key={response._id}
                                type="button"
                                onClick={() => setDetail(response)}
                                className="border-theme-form-container-border/60 hover:bg-theme-form-on-surface/5 rounded-md border p-3 text-left transition-colors"
                            >
                                <span className="flex items-baseline justify-between gap-2">
                                    <span className="text-theme-form-on-surface truncate text-sm font-medium">
                                        {response.email || response.userId}
                                    </span>
                                    <span className="text-theme-form-on-surface/50 shrink-0 text-xs tabular-nums">
                                        #{(page - 1) * limit + index + 1}
                                    </span>
                                </span>

                                <span className="text-theme-form-on-surface/60 mt-0.5 block text-xs">
                                    {formatDate(response.createdAt)}
                                </span>

                                <span className="mt-2 flex flex-col gap-1">
                                    {response.answers.map((answer) => (
                                        <span
                                            key={answer.questionId}
                                            className="text-xs"
                                        >
                                            <span className="text-theme-form-on-surface/55">
                                                {byId
                                                    .get(answer.questionId)
                                                    ?.question.replace(
                                                        /<[^>]*>/g,
                                                        ' '
                                                    ) ?? 'Deleted question'}
                                            </span>{' '}
                                            <AnswerValue
                                                values={answer.values}
                                                question={byId.get(
                                                    answer.questionId
                                                )}
                                            />
                                        </span>
                                    ))}
                                </span>
                            </button>
                        ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        limit={limit}
                        disabled={loading}
                        onPage={setPage}
                        onLimit={(next) => {
                            setLimit(next);
                            setPage(1);
                        }}
                    />

                    <p className="text-theme-form-on-surface/50 -mt-2 text-xs">
                        Select a row to see the full response
                        {questions.length
                            ? ` · ${questions.length} questions`
                            : ''}
                        {summary
                            ? ` · ${answeredBy(questions[0]?._id ?? '')} answered the first question`
                            : ''}
                    </p>
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
