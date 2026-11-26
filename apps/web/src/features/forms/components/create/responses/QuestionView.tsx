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

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

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

    const effectiveId =
        selectedId && entries.some((e) => e.questionId === selectedId)
            ? selectedId
            : (entries[0]?.questionId ?? null);

    if (loading) {
        return (
            <div
                role="status"
                aria-label="Loading question breakdown"
                className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]"
            >
                <div className="space-y-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-theme-skeletion-surface h-10 rounded-md motion-safe:animate-pulse"
                        />
                    ))}
                </div>
                <div className="bg-theme-skeletion-surface h-64 rounded-md motion-safe:animate-pulse" />
            </div>
        );
    }

    if (!summary || entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <span className="bg-brand-light text-on-brand-light flex h-14 w-14 items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-3xl">
                        quiz
                    </span>
                </span>
                <p className="text-theme-on-surface text-sm font-medium">
                    No answers to break down yet
                </p>
                <p className="text-theme-on-surface/55 max-w-xs text-xs">
                    Select a question once responses arrive to inspect every
                    answer.
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
            {/* Left Category-Style Sidebar (matching TemplateGallery aside) */}
            <nav
                role="listbox"
                aria-label="Choose a question"
                className="flex scrollbar-none gap-1.5 overflow-x-auto lg:sticky lg:top-36 lg:flex-col lg:gap-0.5 lg:overflow-visible"
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
                                'flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors lg:w-full lg:shrink',
                                FOCUS_RING,
                                active
                                    ? 'bg-brand-light text-on-brand-light font-medium'
                                    : 'text-theme-on-surface/70 hover:bg-theme-surface-hover hover:text-theme-on-surface'
                            )}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="text-xs tabular-nums opacity-60">
                                    {i + 1}.
                                </span>
                                <span className="max-w-44 truncate lg:max-w-none">
                                    {labelOf(
                                        byId.get(entry.questionId),
                                        'Deleted question'
                                    )}
                                </span>
                            </span>
                            <span className="shrink-0 text-xs tabular-nums opacity-60">
                                {entry.answered}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Right Detail Panel */}
            {selected ? (
                <section
                    aria-label={labelOf(selectedQuestion, 'Answers')}
                    className="border-theme-skeletion-surface min-w-0 rounded-md border p-5 sm:p-6"
                >
                    <header className="border-theme-on-surface/10 mb-5 border-b pb-4">
                        <h3 className="text-theme-on-surface text-base font-semibold tracking-tight">
                            {labelOf(selectedQuestion, 'Deleted question')}
                        </h3>
                        <p className="text-theme-on-surface/55 mt-1 text-xs tabular-nums">
                            {selected.answered} of{' '}
                            {totalResponses || selected.answered} answered
                        </p>
                    </header>

                    <ul className="flex flex-col gap-3.5">
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
                                    className="flex items-center gap-4"
                                >
                                    <span className="text-theme-on-surface/85 w-40 shrink-0 truncate text-xs sm:w-56">
                                        <AnswerValue
                                            values={[item.value]}
                                            question={selectedQuestion}
                                        />
                                    </span>
                                    <span className="bg-theme-on-surface/8 h-2 flex-1 overflow-hidden rounded-full">
                                        <span
                                            className="bg-brand block h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${Math.max(percent, 2)}%`,
                                            }}
                                        />
                                    </span>
                                    <span className="text-theme-on-surface/60 w-20 shrink-0 text-right text-xs tabular-nums">
                                        {item.count} · {percent}%
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
