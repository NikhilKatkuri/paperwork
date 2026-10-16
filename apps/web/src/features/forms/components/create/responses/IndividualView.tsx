'use client';

import { useMemo, useState } from 'react';
import AnswerValue from './AnswerValue';
import {
    useAllResponses,
    type ResponseFilters,
} from '../../../api/user/formResponses';
import type { FormResponseDto, QuestionDoc } from '@paperwork/types';

function formatDate(value: unknown): string {
    if (!value) return 'Unknown time';
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function stripHtml(value: string): string {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function Skeleton() {
    return (
        <div
            role="status"
            aria-label="Loading response"
            className="flex flex-col gap-3"
        >
            <div className="bg-theme-form-container-border/50 h-16 animate-pulse rounded-xl" />
            <div className="bg-theme-form-container-border/50 h-64 animate-pulse rounded-xl" />
        </div>
    );
}

/**
 * Individual tab: step through responses one by one with prev/next
 * navigation and the full question/answer list.
 */
export default function IndividualView({
    formId,
    filters,
    questions,
    resetKey,
}: Readonly<{
    formId: string;
    filters: ResponseFilters;
    questions: QuestionDoc[];
    resetKey: string;
}>) {
    const { responses, total, truncated, loading, error } = useAllResponses(
        formId,
        filters
    );
    // Reset the pager when the filter set changes. Adjusted during render
    // (the documented derived-state pattern) instead of in an effect.
    const pageKey = `${formId}:${resetKey}`;
    const [pager, setPager] = useState({ key: pageKey, index: 0 });
    if (pager.key !== pageKey) {
        setPager({ key: pageKey, index: 0 });
    }
    const index = pager.index;
    const setIndex = (updater: number | ((i: number) => number)) =>
        setPager((p) => ({
            key: p.key,
            index: typeof updater === 'function' ? updater(p.index) : updater,
        }));

    const orderedQuestions = useMemo(
        () => [...questions].sort((a, b) => a.index - b.index),
        [questions]
    );

    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="border-theme-form-container-border bg-theme-form-container flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
                <span className="text-theme-form-on-surface/30 material-symbols-outlined text-3xl">
                    error
                </span>
                <p className="text-theme-form-on-container text-sm font-medium">
                    Couldn&apos;t load responses
                </p>
                <p
                    role="alert"
                    className="text-theme-form-on-surface/60 max-w-xs text-xs"
                >
                    {error}
                </p>
            </div>
        );
    }

    if (responses.length === 0) {
        return (
            <div className="border-theme-form-container-border bg-theme-form-container flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
                <span className="text-theme-form-on-surface/30 material-symbols-outlined text-3xl">
                    inbox
                </span>
                <p className="text-theme-form-on-container text-sm font-medium">
                    No responses yet
                </p>
                <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                    Responses appear here as soon as someone fills in the form.
                </p>
            </div>
        );
    }

    const safeIndex = Math.min(index, responses.length - 1);
    const response: FormResponseDto = responses[safeIndex]!;
    const respondent = response.email || response.userId || 'Anonymous';
    const answerById = new Map(response.answers.map((a) => [a.questionId, a]));

    const pagerButton =
        'text-theme-form-on-container grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-theme-form-container-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

    return (
        <div className="flex flex-col gap-3">
            {/* Pager header */}
            <div className="border-theme-form-container-border bg-theme-form-container flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="bg-theme-form-container-active text-theme-form-on-active grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
                    >
                        {(respondent[0] ?? '?').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="text-theme-form-on-container truncate text-sm font-semibold">
                            {respondent}
                        </p>
                        <p className="text-theme-form-on-surface/60 text-xs">
                            Submitted{' '}
                            {formatDate(
                                (response as unknown as { createdAt?: unknown })
                                    .createdAt
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        disabled={safeIndex <= 0}
                        aria-label="Previous response"
                        className={pagerButton}
                    >
                        <span className="material-symbols-outlined text-lg">
                            chevron_left
                        </span>
                    </button>
                    <span
                        role="status"
                        aria-label={`Response ${safeIndex + 1} of ${total || responses.length}`}
                        className="text-theme-form-on-surface/70 min-w-16 text-center text-xs tabular-nums"
                    >
                        {safeIndex + 1} of {total || responses.length}
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            setIndex((i) =>
                                Math.min(responses.length - 1, i + 1)
                            )
                        }
                        disabled={safeIndex >= responses.length - 1}
                        aria-label="Next response"
                        className={pagerButton}
                    >
                        <span className="material-symbols-outlined text-lg">
                            chevron_right
                        </span>
                    </button>
                </div>
            </div>

            {truncated ? (
                <p className="text-theme-form-on-surface/50 text-xs">
                    Showing the first {responses.length} of {total} responses.
                    Refine the search or export CSV to see more.
                </p>
            ) : null}

            {/* Full Q&A */}
            <dl
                key={String(
                    (response as unknown as { id?: unknown }).id ?? safeIndex
                )}
                className="border-theme-form-container-border bg-theme-form-container flex flex-col gap-1 rounded-xl border p-4 shadow-sm sm:p-5"
            >
                {orderedQuestions.map((question) => {
                    const answer = answerById.get(question.id);
                    const values: string[] = answer
                        ? (Array.isArray(answer.value)
                              ? answer.value
                              : [answer.value]
                          ).map((v) => String(v))
                        : [];
                    return (
                        <div
                            key={question.id}
                            className="odd:bg-theme-form-container-hover rounded-lg px-3 py-2.5"
                        >
                            <dt className="text-theme-form-on-surface/60 mb-1 text-xs font-medium">
                                {stripHtml(question.question)}
                                {question.isRequired ? (
                                    <span
                                        aria-hidden="true"
                                        className="ml-1 text-red-500"
                                    >
                                        *
                                    </span>
                                ) : null}
                            </dt>
                            <dd className="text-theme-form-on-container text-sm">
                                <AnswerValue
                                    values={values}
                                    question={question}
                                />
                            </dd>
                        </div>
                    );
                })}
            </dl>

            {response.metadata ? (
                <p className="text-theme-form-on-surface/50 truncate px-1 text-[11px]">
                    {response.metadata.ipAddress ?? 'unknown IP'} ·{' '}
                    {response.metadata.userAgent ?? 'unknown device'}
                </p>
            ) : null}
        </div>
    );
}
