'use client';

import QuestionInput from './QuestionInput';
import type { FillSection } from '../../types/fill.type';

interface SectionViewProps {
    section: FillSection;
    answers: Record<string, string[]>;
    errors: Record<string, string>;
    onChange: (questionId: string, values: string[]) => void;
}

/** Strips the tags a rich-text question body may contain. */
export function plainText(html: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}

export default function SectionView({
    section,
    answers,
    errors,
    onChange,
}: Readonly<SectionViewProps>) {
    if (!section.questions.length) return null;

    return (
        <section className="flex flex-col gap-8 overflow-hidden rounded-xl bg-white pb-6">
            <header className="bg-theme-form-container-active flex flex-col p-4">
                <h2 className="text-lg font-semibold text-white">
                    {section.title || 'Untitled section'}
                </h2>
                {section.description ? (
                    <p className="mt-1 text-sm text-white/90">
                        {plainText(section.description)}
                    </p>
                ) : null}
            </header>

            {section.questions.map((question) => {
                const error = errors[question._id];

                return (
                    <div
                        key={question._id}
                        className="flex flex-col gap-2 px-4"
                    >
                        <label
                            className="text-theme-form-on-surface text-sm font-medium"
                            htmlFor={`q-${question._id}`}
                        >
                            {plainText(question.question)}
                            {question.isRequired ? (
                                <span
                                    aria-hidden="true"
                                    className="ml-1 text-red-500"
                                >
                                    *
                                </span>
                            ) : null}
                        </label>

                        {question.helpText ? (
                            <p className="text-theme-form-on-surface/60 text-xs">
                                {plainText(question.helpText)}
                            </p>
                        ) : null}

                        <div id={`q-${question._id}`}>
                            <QuestionInput
                                question={question}
                                values={answers[question._id] ?? []}
                                onChange={(values) =>
                                    onChange(question._id, values)
                                }
                                invalid={Boolean(error)}
                            />
                        </div>

                        {error ? (
                            <p
                                role="alert"
                                className="text-sm text-red-500 dark:text-red-400"
                            >
                                {error}
                            </p>
                        ) : null}
                    </div>
                );
            })}
        </section>
    );
}
