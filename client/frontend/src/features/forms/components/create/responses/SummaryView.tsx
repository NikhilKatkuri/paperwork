'use client';

import AnswerValue from './AnswerValue';
import type { ResponseSummary } from '../../../types/response.type';
import type QuestionCore from '../../../types/question.type';

function labelOf(question: QuestionCore | undefined): string {
    if (!question) return 'Deleted question';

    return question.question.replace(/<[^>]*>/g, ' ').trim();
}

/**
 * Per-question totals, Google Forms style: each distinct answer with how many
 * people gave it.
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
    questions: QuestionCore[];
    loading: boolean;
    totalResponses: number;
}>) {
    const byId = new Map(questions.map((q) => [q._id, q]));

    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                    <div
                        key={i}
                        className="bg-theme-form-on-surface/8 h-28 animate-pulse rounded-xl"
                    />
                ))}
            </div>
        );
    }

    if (!summary || summary.questions.length === 0) {
        return (
            <div className="border-theme-form-container-border/60 flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
                <span className="material-symbols-outlined text-theme-form-on-surface/30 text-3xl">
                    query_stats
                </span>
                <p className="text-theme-form-on-surface text-sm font-medium">
                    Nothing to summarise yet
                </p>
                <p className="text-theme-form-on-surface/60 max-w-xs text-xs">
                    Once responses come in, each question is totalled here.
                </p>
            </div>
        );
    }

    // Highest answered first, so the questions people actually answered lead.
    const ordered = [...summary.questions].sort(
        (a, b) => b.answered - a.answered
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
                        className="border-theme-form-container-border/50 bg-theme-form-container rounded-xl border p-4"
                    >
                        <header className="mb-3">
                            <h3 className="text-theme-form-on-surface text-sm font-semibold">
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
                            className="bg-theme-form-on-surface/10 mb-4 h-1 overflow-hidden rounded-full"
                        >
                            <div
                                className="bg-theme-form-container-active h-full rounded-full transition-all"
                                style={{ width: `${share}%` }}
                            />
                        </div>

                        <ul className="flex flex-col gap-2.5">
                            {entry.values.map((item) => {
                                const percent =
                                    totalResponses > 0
                                        ? Math.round(
                                              (item.count / totalResponses) *
                                                  100
                                          )
                                        : 0;

                                return (
                                    <li
                                        key={item.value}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-theme-form-on-surface/85 w-40 shrink-0 truncate text-xs">
                                            <AnswerValue
                                                values={[item.value]}
                                                question={question}
                                            />
                                        </span>

                                        <span className="bg-theme-form-on-surface/8 h-1.5 flex-1 overflow-hidden rounded-full">
                                            <span
                                                className="bg-theme-form-container-active/70 block h-full rounded-full"
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
