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
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                {Array.from({ length: 4 }, (_, i) => (
                    <div
                        key={i}
                        className="border-theme-on-surface/10 space-y-3 rounded-md border p-5"
                    >
                        <div className="bg-theme-skeletion-surface h-4 w-2/3 rounded-sm motion-safe:animate-pulse" />
                        <div className="bg-theme-skeletion-surface h-3 w-1/4 rounded-sm motion-safe:animate-pulse" />
                        <div className="space-y-2 pt-2">
                            <div className="bg-theme-skeletion-surface h-2.5 w-full rounded-full motion-safe:animate-pulse" />
                            <div className="bg-theme-skeletion-surface h-2.5 w-4/5 rounded-full motion-safe:animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!summary || summary.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <span className="bg-brand-light text-on-brand-light flex h-14 w-14 items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-3xl">
                        query_stats
                    </span>
                </span>
                <p className="text-theme-on-surface text-sm font-medium">
                    Nothing to summarise yet
                </p>
                <p className="text-theme-on-surface/55 max-w-xs text-xs">
                    Once responses come in, each question breakdown will appear
                    here.
                </p>
            </div>
        );
    }

    const position = new Map(questions.map((q, i) => [q.id, i]));
    const ordered = [...summary.questions].sort(
        (a, b) =>
            (position.get(a.questionId) ?? Number.MAX_SAFE_INTEGER) -
            (position.get(b.questionId) ?? Number.MAX_SAFE_INTEGER)
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Template-style Section Heading */}
            <div className="flex items-center gap-3">
                <h2 className="text-theme-on-surface text-sm font-semibold tracking-tight">
                    Question breakdown
                </h2>
                <span className="text-theme-on-surface/50 text-xs font-medium tabular-nums">
                    {ordered.length}
                </span>
                <span className="bg-theme-on-surface/10 h-px flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ordered.map((entry, idx) => {
                    const question = byId.get(entry.questionId);
                    const share =
                        totalResponses > 0
                            ? Math.round(
                                  (entry.answered / totalResponses) * 100
                              )
                            : 0;

                    return (
                        <section
                            key={entry.questionId}
                            aria-label={labelOf(question)}
                            className="border-theme-skeletion-surface hover:border-theme-on-surface/20 flex flex-col justify-between rounded-md border p-5 transition-colors"
                        >
                            <div>
                                <header className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-2.5">
                                        <span className="bg-brand-light text-on-brand-light mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm text-[11px] font-semibold tabular-nums">
                                            {idx + 1}
                                        </span>
                                        <h3 className="text-theme-on-surface text-sm leading-snug font-medium">
                                            {labelOf(question)}
                                        </h3>
                                    </div>
                                    <span className="text-theme-on-surface/50 shrink-0 text-[11px] tabular-nums">
                                        {entry.answered}/
                                        {totalResponses || entry.answered} (
                                        {share}%)
                                    </span>
                                </header>

                                <ul className="mt-4 flex flex-col gap-2.5">
                                    {entry.values.map((item) => {
                                        const percent =
                                            entry.answered > 0
                                                ? Math.round(
                                                      (item.count /
                                                          entry.answered) *
                                                          100
                                                  )
                                                : 0;

                                        return (
                                            <li
                                                key={item.value}
                                                className="flex flex-col gap-1"
                                            >
                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                    <span className="text-theme-on-surface/85 truncate">
                                                        <AnswerValue
                                                            values={[
                                                                item.value,
                                                            ]}
                                                            question={question}
                                                        />
                                                    </span>
                                                    <span className="text-theme-on-surface/55 shrink-0 tabular-nums">
                                                        {item.count} · {percent}
                                                        %
                                                    </span>
                                                </div>

                                                <div className="bg-theme-on-surface/8 h-1.5 w-full overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-brand h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.max(
                                                                percent,
                                                                2
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
