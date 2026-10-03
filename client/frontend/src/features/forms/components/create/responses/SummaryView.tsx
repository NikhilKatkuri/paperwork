'use client';

import AnswerValue from './AnswerValue';
import type { ResponseSummary } from '../../../types/response.type';
import type QuestionCore from '../../../types/question.type';

/**
 * Per-question totals, Google Forms style: every distinct answer for a question
 * with how many people gave it.
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
                        className="bg-theme-form-on-surface/10 h-20 animate-pulse rounded-md"
                    />
                ))}
            </div>
        );
    }

    if (!summary || summary.questions.length === 0) {
        return (
            <p className="text-theme-form-on-surface/60 py-10 text-center text-sm">
                No answers to summarise yet.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {summary.questions.map((entry) => {
                const question = byId.get(entry.questionId);

                return (
                    <section
                        key={entry.questionId}
                        className="border-theme-form-container-border/60 rounded-md border p-4"
                    >
                        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-theme-form-on-surface text-sm font-semibold">
                                {question?.question
                                    .replace(/<[^>]*>/g, ' ')
                                    .trim() ?? 'Deleted question'}
                            </h3>
                            <span className="text-theme-form-on-surface/60 text-xs">
                                {entry.answered}/
                                {totalResponses || entry.answered} answered
                            </span>
                        </header>

                        <ul className="flex flex-col gap-1.5">
                            {entry.values.map((item) => {
                                const percent = totalResponses
                                    ? Math.round(
                                          (item.count / totalResponses) * 100
                                      )
                                    : 0;

                                return (
                                    <li
                                        key={item.value}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-theme-form-on-surface/80 min-w-0 flex-1 text-xs">
                                            <AnswerValue
                                                values={[item.value]}
                                                question={question}
                                            />
                                        </span>

                                        <span className="bg-theme-form-on-surface/10 relative hidden h-1.5 flex-1 overflow-hidden rounded-full sm:block">
                                            <span
                                                className="bg-theme-form-container-active absolute inset-y-0 left-0 rounded-full"
                                                style={{
                                                    width: `${percent}%`,
                                                }}
                                            />
                                        </span>

                                        <span className="text-theme-form-on-surface/60 w-16 shrink-0 text-right text-xs tabular-nums">
                                            {item.count} · {percent}%
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
