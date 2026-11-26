'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AnswerValue from './AnswerValue';
import ConfirmDialog from './ConfirmDialog';
import {
    deleteResponse,
    useAllResponses,
    type ResponseFilters,
} from '../../../api/user/formResponses';
import type { FormResponseDto, QuestionDoc } from '@paperwork/types';
import { cn } from '@/utils/cn';

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

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

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
    const {
        responses: fetchedResponses,
        total,
        truncated,
        loading,
        error,
    } = useAllResponses(formId, filters);

    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

    const responses = useMemo(
        () => fetchedResponses.filter((r) => !deletedIds.has(r.id)),
        [fetchedResponses, deletedIds]
    );

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

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const handleDelete = useCallback((id: string) => {
        setConfirmId(id);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!confirmId) return;
        setDeletingId(confirmId);
        try {
            await deleteResponse(formId, confirmId);
            setDeletedIds((prev) => {
                const next = new Set(prev);
                next.add(confirmId);
                return next;
            });
            setIndex((i) =>
                Math.max(0, Math.min(i, Math.max(0, responses.length - 2)))
            );
            toast.success('Response deleted');
        } catch (e: unknown) {
            toast.error(
                e instanceof Error ? e.message : 'Failed to delete response'
            );
        } finally {
            setDeletingId(null);
            setConfirmId(null);
        }
    }, [confirmId, formId, responses.length]);

    const orderedQuestions = useMemo(
        () => [...questions].sort((a, b) => a.index - b.index),
        [questions]
    );

    if (loading) {
        return (
            <div
                role="status"
                aria-label="Loading response"
                className="flex flex-col gap-4"
            >
                <div className="bg-theme-skeletion-surface h-14 rounded-md motion-safe:animate-pulse" />
                <div className="bg-theme-skeletion-surface h-72 rounded-md motion-safe:animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <span className="bg-brand-light text-on-brand-light flex h-14 w-14 items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-3xl">
                        error
                    </span>
                </span>
                <p className="text-theme-on-surface text-sm font-medium">
                    {"Couldn't load responses"}
                </p>
                <p
                    role="alert"
                    className="text-theme-on-surface/55 max-w-xs text-xs"
                >
                    {error}
                </p>
            </div>
        );
    }

    if (responses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <span className="bg-brand-light text-on-brand-light flex h-14 w-14 items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-3xl">
                        inbox
                    </span>
                </span>
                <p className="text-theme-on-surface text-sm font-medium">
                    No responses yet
                </p>
                <p className="text-theme-on-surface/55 max-w-xs text-xs">
                    Submissions will appear here as soon as someone completes
                    your form.
                </p>
            </div>
        );
    }

    const safeIndex = Math.min(index, responses.length - 1);
    const response: FormResponseDto = responses[safeIndex]!;
    const respondent = response.email || response.userId || 'Anonymous';
    const answerById = new Map(response.answers.map((a) => [a.questionId, a]));

    const pagerButton = cn(
        'border-theme-on-surface/15 text-theme-on-surface hover:bg-theme-surface-hover grid h-8 w-8 cursor-pointer place-items-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
        FOCUS_RING
    );

    return (
        <>
            <div className="flex flex-col gap-5">
                {/* Clean Respondent & Pager Bar */}
                <div className="border-theme-skeletion-surface flex flex-wrap items-center justify-between gap-4 rounded-md border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="bg-brand-light text-on-brand-light grid h-9 w-9 shrink-0 place-items-center rounded-md text-xs font-semibold"
                        >
                            {(respondent[0] ?? '?').toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="text-theme-on-surface truncate text-sm font-medium">
                                {respondent}
                            </p>
                            <p className="text-theme-on-surface/55 text-xs">
                                Submitted{' '}
                                {formatDate(
                                    (
                                        response as unknown as {
                                            createdAt?: unknown;
                                        }
                                    ).createdAt
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIndex((i) => Math.max(0, i - 1))}
                            disabled={safeIndex <= 0}
                            aria-label="Previous response"
                            className={pagerButton}
                        >
                            <span className="material-symbols-outlined text-base">
                                chevron_left
                            </span>
                        </button>
                        <span
                            role="status"
                            aria-label={`Response ${safeIndex + 1} of ${total || responses.length}`}
                            className="text-theme-on-surface/70 min-w-16 text-center text-xs font-medium tabular-nums"
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
                            <span className="material-symbols-outlined text-base">
                                chevron_right
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                response.id && handleDelete(response.id)
                            }
                            disabled={
                                deletingId === response.id || !response.id
                            }
                            aria-label="Delete this response"
                            className={cn(
                                pagerButton,
                                'border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40'
                            )}
                        >
                            <span className="material-symbols-outlined text-base">
                                delete
                            </span>
                        </button>
                    </div>
                </div>

                {truncated ? (
                    <p className="text-theme-on-surface/55 text-xs">
                        Showing the first {responses.length} of {total}{' '}
                        responses. Refine your search or export CSV to view all.
                    </p>
                ) : null}

                {/* Clean Q&A List */}
                <dl
                    key={String(
                        (response as unknown as { id?: unknown }).id ??
                            safeIndex
                    )}
                    className="border-theme-skeletion-surface divide-theme-on-surface/8 divide-y rounded-md border"
                >
                    {orderedQuestions.map((question, idx) => {
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
                                className="hover:bg-theme-surface-hover/50 flex flex-col gap-1.5 px-5 py-4 transition-colors"
                            >
                                <dt className="text-theme-on-surface/60 flex items-center gap-2 text-xs font-medium">
                                    <span className="tabular-nums opacity-60">
                                        {idx + 1}.
                                    </span>
                                    <span>
                                        {stripHtml(question.question)}
                                        {question.isRequired ? (
                                            <span
                                                aria-hidden="true"
                                                className="ml-1 text-red-500"
                                            >
                                                *
                                            </span>
                                        ) : null}
                                    </span>
                                </dt>
                                <dd className="text-theme-on-surface pl-5 text-sm">
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
                    <p className="text-theme-on-surface/45 truncate text-[11px]">
                        {response.metadata.ipAddress ?? 'Unknown IP'} ·{' '}
                        {response.metadata.userAgent ?? 'Unknown device'}
                    </p>
                ) : null}
            </div>
            <ConfirmDialog
                isOpen={Boolean(confirmId)}
                onClose={() => setConfirmId(null)}
                onConfirm={handleConfirmDelete}
                isLoading={deletingId === confirmId}
                title="Delete response"
                message="This response will be permanently removed and cannot be undone."
                confirmLabel="Delete response"
                cancelLabel="Cancel"
                danger
            />
        </>
    );
}
