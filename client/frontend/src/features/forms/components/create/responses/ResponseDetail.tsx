'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import AnswerValue from './AnswerValue';
import type { FormResponse } from '../../../types/response.type';
import type QuestionCore from '../../../types/question.type';

function formatDate(value: string | number): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/** Full response detail, shown in a dialog. */
export default function ResponseDetail({
    response,
    questions,
    onClose,
}: Readonly<{
    response: FormResponse | null;
    questions: QuestionCore[];
    onClose: () => void;
}>) {
    useEffect(() => {
        if (!response) return;

        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', onKey);

        // Stop the page behind the dialog scrolling while it is open.
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [response, onClose]);

    if (!response) return null;

    // Questions in their authored order, so the detail reads top-down.
    const ordered = [...questions].sort((a, b) => a.index - b.index);
    const section = ordered.find((question) =>
        response.answers.some((answer) => answer.questionId === question._id)
    );

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Response detail"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-theme-form-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl">
                <header className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-theme-form-on-surface text-base font-semibold">
                            {response.email || response.userId}
                        </h3>
                        <p className="text-theme-form-on-surface/60 text-xs">
                            Submitted {formatDate(response.createdAt)}
                            {section ? ` · ${section.index + 1}` : ''}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-theme-form-on-surface/60 hover:bg-theme-form-on-surface/10 rounded-full p-1.5 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <dl className="flex flex-col gap-4">
                    {ordered.map((question) => {
                        const answer = response.answers.find(
                            (a) => a.questionId === question._id
                        );

                        return (
                            <div
                                key={question._id}
                                className="border-theme-form-container-border/40 border-b pb-3 last:border-b-0 last:pb-0"
                            >
                                <dt className="text-theme-form-on-surface/70 mb-1 text-xs font-medium">
                                    {question.question
                                        .replace(/<[^>]*>/g, ' ')
                                        .trim()}
                                    {question.isRequired ? (
                                        <span
                                            aria-hidden="true"
                                            className="ml-1 text-red-500"
                                        >
                                            *
                                        </span>
                                    ) : null}
                                </dt>
                                <dd className="text-theme-form-on-surface text-sm">
                                    <AnswerValue
                                        values={answer?.values ?? []}
                                        question={question}
                                    />
                                </dd>
                            </div>
                        );
                    })}
                </dl>

                {response.metadata ? (
                    <footer className="text-theme-form-on-surface/50 mt-5 border-t pt-3 text-xs">
                        <p className="truncate">
                            {response.metadata.ipAddress ?? 'unknown IP'}
                        </p>
                        <p className="mt-0.5 line-clamp-2">
                            {response.metadata.userAgent ?? 'unknown agent'}
                        </p>
                    </footer>
                ) : null}
            </div>
        </div>,
        document.body
    );
}
