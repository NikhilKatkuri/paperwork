'use client';

import AnswerValue from './AnswerValue';
import type { ResponseSummary } from '../../../api/user/formResponses';
import type { QuestionDoc } from '@paperwork/types';

function labelOf(question: QuestionDoc | undefined): string {
    if (!question) return 'Deleted question';

    return question.question
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Per-question totals: each distinct answer with how many people gave it.
 *
 * Driven by the summary endpoint, so the figures cover every matching response
 * rather than the page currently on screen.
 */
export default function SummaryView({
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
    const byId = new Map(questions.map((q) => [q.id, q]));

    if (loading) {
        return (
            <div
                role="status"
                aria-label="Loading summary"
                className="flex flex-col gap-3"
            >
                {Array.from({ length: 4 }, (_, i) => (
                    <div
                        key={i}
                        className="bg-theme-form-container-border/50 h-28 animate-pulse rounded-xl"
                    />
                ))}
            </div>
        );
    }

    if (!summary || summary.questions.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <span className="text-theme-form-on-surface/30 material-symbols-outlined text-3xl">
                    query_stats
                </span>
                <p className="text-theme-form-on-container text-sm font-medium">
                    Nothing to summarise yet
                </p>
                <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                    Once responses come in, each question is totalled here.
                </p>
            </div>
        );
    }

    // Form order, like the respondent saw the questions.
    const position = new Map(questions.map((q, i) => [q.id, i]));
    const ordered = [...summary.questions].sort(
        (a, b) =>
            (position.get(a.questionId) ?? Number.MAX_SAFE_INTEGER) -
            (position.get(b.questionId) ?? Number.MAX_SAFE_INTEGER)
    );

    return (
        <div className="flex flex-col gap-3">
            {ordered.map((entry) => {
                const question = byId.get(entry.questionId);
                const share =
                    totalResponses > 0
                        ? Math.round((entry.answered / totalResponses) * 100)
                        : 0;

                return (
                    <section
                        key={entry.questionId}
                        aria-label={labelOf(question)}
                        className="border-theme-form-container-border bg-theme-form-container rounded-xl border p-4 shadow-sm sm:p-5"
                    >
                        <header className="mb-3">
                            <h3 className="text-theme-form-on-container text-sm font-semibold">
                                {labelOf(question)}
                            </h3>
                            <p className="text-theme-form-on-surface/60 mt-0.5 text-xs">
                                {entry.answered} of{' '}
                                {totalResponses || entry.answered} answered
                            </p>
                        </header>

                        {/* How much of the cohort answered this at all. */}
                        <div
                            role="progressbar"
                            aria-valuenow={share}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${share}% answered`}
                            className="bg-theme-form-container-border/50 mb-4 h-1 overflow-hidden rounded-full"
                        >
                            <div
                                className="bg-theme-form-container-active h-full rounded-full transition-all"
                                style={{ width: `${share}%` }}
                            />
                        </div>

                        <ul className="flex flex-col gap-2.5">
                            {entry.values.map((item) => {
                                const percent =
                                    entry.answered > 0
                                        ? Math.round(
                                              (item.count / entry.answered) *
                                                  100
                                          )
                                        : 0;

                                return (
                                    <li
                                        key={item.value}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-theme-form-on-container/80 w-40 shrink-0 truncate text-xs">
                                            <AnswerValue
                                                values={[item.value]}
                                                question={question}
                                            />
                                        </span>

                                        <span className="bg-theme-form-container-border/50 h-1.5 flex-1 overflow-hidden rounded-full">
                                            <span
                                                className="bg-theme-form-container-active/80 block h-full rounded-full"
                                                style={{
                                                    width: `${Math.max(
                                                        percent,
                                                        2
                                                    )}%`,
                                                }}
                                            />
                                        </span>

                                        <span className="text-theme-form-on-surface/60 w-16 shrink-0 text-right text-xs tabular-nums">
                                            {item.count}
                                            <span className="opacity-60">
                                                {' · '}
                                                {percent}%
                                            </span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
