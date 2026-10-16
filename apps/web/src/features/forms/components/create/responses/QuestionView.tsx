'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import AnswerValue from './AnswerValue';
import type { ResponseSummary } from '../../../api/user/formResponses';
import type { QuestionDoc } from '@paperwork/types';

function labelOf(question: QuestionDoc | undefined, fallback: string): string {
    if (!question) return fallback;
    const label = question.question
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return label || fallback;
}

function Skeleton() {
    return (
        <div
            role="status"
            aria-label="Loading question breakdown"
            className="flex flex-col gap-3 md:flex-row"
        >
            <div className="bg-theme-form-container-border/50 h-64 animate-pulse rounded-xl md:w-72" />
            <div className="bg-theme-form-container-border/50 h-64 flex-1 animate-pulse rounded-xl" />
        </div>
    );
}

/**
 * Question tab: pick a question on the left, see every distinct answer with
 * counts and share bars on the right.
 */
export default function QuestionView({
    summary,
    questions,
    loading,
    totalResponses,
}: Readonly<{
    summary: ResponseSummary | null;
    questions: QuestionDoc[];
    loading: boolean;
    totalResponses: number;
}>) {
    const byId = useMemo(
        () => new Map(questions.map((q) => [q.id, q])),
        [questions]
    );

    const entries = useMemo(() => {
        if (!summary) return [];
        const order = new Map(questions.map((q, i) => [q.id, i]));
        return [...summary.questions].sort(
            (a, b) =>
                (order.get(a.questionId) ?? 0) - (order.get(b.questionId) ?? 0)
        );
    }, [summary, questions]);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Reconciled during render: fall back to the first entry when the
    // selection is missing or stale (e.g. after filters change).
    const effectiveId =
        selectedId && entries.some((e) => e.questionId === selectedId)
            ? selectedId
            : (entries[0]?.questionId ?? null);

    if (loading) return <Skeleton />;

    if (!summary || entries.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <span className="text-theme-form-on-surface/30 material-symbols-outlined text-3xl">
                    quiz
                </span>
                <p className="text-theme-form-on-container text-sm font-medium">
                    No answers to break down yet
                </p>
                <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                    Pick a question on the left once responses come in.
                </p>
            </div>
        );
    }

    const selected =
        entries.find((e) => e.questionId === effectiveId) ?? entries[0];
    const selectedQuestion = selected
        ? byId.get(selected.questionId)
        : undefined;

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {/* Question picker */}
            <div
                role="listbox"
                aria-label="Choose a question"
                className="border-theme-form-container-border bg-theme-form-container flex gap-1 overflow-x-auto rounded-xl border p-1.5 shadow-sm md:sticky md:top-0 md:w-72 md:shrink-0 md:flex-col md:overflow-visible"
            >
                {entries.map((entry, i) => {
                    const active = entry.questionId === selected?.questionId;
                    return (
                        <button
                            key={entry.questionId}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => setSelectedId(entry.questionId)}
                            className={cn(
                                'flex min-w-44 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors md:min-w-0',
                                active
                                    ? 'bg-theme-form-container-active/10 text-theme-form-on-container'
                                    : 'text-theme-form-on-surface/60 hover:bg-theme-form-container-hover'
                            )}
                        >
                            <span
                                className={cn(
                                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums',
                                    active
                                        ? 'bg-theme-form-container-active text-theme-form-on-active'
                                        : 'bg-theme-form-container-border/50 text-theme-form-on-surface/60'
                                )}
                            >
                                {i + 1}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-medium">
                                    {labelOf(
                                        byId.get(entry.questionId),
                                        'Deleted question'
                                    )}
                                </span>
                                <span className="block text-[11px] text-neutral-400 tabular-nums">
                                    {entry.answered} answered
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Answers breakdown */}
            {selected ? (
                <section
                    aria-label={labelOf(selectedQuestion, 'Answers')}
                    className="border-theme-form-container-border bg-theme-form-container min-w-0 flex-1 rounded-xl border p-4 shadow-sm sm:p-5"
                >
                    <header className="mb-1">
                        <h3 className="text-theme-form-on-container text-sm font-semibold sm:text-base">
                            {labelOf(selectedQuestion, 'Deleted question')}
                        </h3>
                        <p className="text-theme-form-on-surface/60 mt-0.5 text-xs tabular-nums">
                            {selected.answered} of{' '}
                            {totalResponses || selected.answered} answered
                        </p>
                    </header>

                    <ul className="mt-4 flex flex-col gap-3">
                        {selected.values.map((item) => {
                            const percent =
                                selected.answered > 0
                                    ? Math.round(
                                          (item.count / selected.answered) * 100
                                      )
                                    : 0;
                            return (
                                <li
                                    key={item.value}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-theme-form-on-container/80 w-36 shrink-0 truncate text-xs sm:w-48">
                                        <AnswerValue
                                            values={[item.value]}
                                            question={selectedQuestion}
                                        />
                                    </span>
                                    <span className="bg-theme-form-container-border/50 h-2 flex-1 overflow-hidden rounded-full">
                                        <span
                                            className="bg-theme-form-container-active block h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.max(percent, 2)}%`,
                                            }}
                                        />
                                    </span>
                                    <span className="text-theme-form-on-surface/60 w-20 shrink-0 text-right text-xs tabular-nums">
                                        {item.count}
                                        <span className="opacity-60">
                                            {' '}
                                            · {percent}%
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}
        </div>
    );
}
