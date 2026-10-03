'use client';

import { useState } from 'react';
import { QUESTION_TYPE } from '../../../types/question.type';
import type QuestionCore from '../../../types/question.type';

const RATING_ICONS: Record<string, string> = {
    STAR: 'star',
    HEART: 'favorite',
    THUMB_UP: 'thumb_up',
};

/** Long free text is clamped until expanded. */
function Clamped({ text }: Readonly<{ text: string }>) {
    const [open, setOpen] = useState(false);
    const isLong = text.length > 140;

    if (!isLong) return <span>{text}</span>;

    return (
        <span>
            <span className={open ? '' : 'line-clamp-2'}>{text}</span>{' '}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-theme-form-container-active hover:underline"
            >
                {open ? 'Show less' : 'Show more'}
            </button>
        </span>
    );
}

function Chip({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <span className="bg-theme-form-on-surface/8 border-theme-form-on-surface/15 inline-block max-w-full rounded-full border px-2 py-0.5 text-xs">
            {children}
        </span>
    );
}

/**
 * Renders a stored answer using the question's own type.
 *
 * Stored values are always plain strings, so the question is needed to know
 * that "5" is a rating rather than a number, or that a value is one choice out
 * of a known set.
 */
export default function AnswerValue({
    values,
    question,
}: Readonly<{
    values: string[];
    question?: QuestionCore;
}>) {
    const answers = values.filter((v) => v.trim());

    if (!answers.length) {
        return (
            <span className="text-theme-form-on-surface/40 text-xs">
                No answer
            </span>
        );
    }

    switch (question?.type) {
        case QUESTION_TYPE.RATING: {
            const scale = Math.max(
                1,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const picked = Number(answers[0]);
            const icon = RATING_ICONS[question.ratingConfig?.icon ?? 'STAR'];

            return (
                <span
                    className="text-theme-form-container-active inline-flex items-center gap-0.5"
                    aria-label={`${answers[0]} out of ${scale}`}
                >
                    {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
                        <span
                            key={n}
                            className={`material-symbols-outlined text-base ${
                                n <= picked ? '' : 'opacity-25'
                            }`}
                        >
                            {icon}
                        </span>
                    ))}
                </span>
            );
        }

        case QUESTION_TYPE.LINEAR_SCALE: {
            const value = Number(answers[0]);
            const high = Math.max(
                2,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );

            return (
                <span className="inline-flex items-center gap-2">
                    <span className="bg-theme-form-on-surface/10 relative inline-block h-1.5 w-24 overflow-hidden rounded-full">
                        <span
                            className="bg-theme-form-container-active absolute inset-y-0 left-0 rounded-full"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(0, (value / high) * 100)
                                )}%`,
                            }}
                        />
                    </span>
                    <span className="text-theme-form-on-surface text-xs font-medium">
                        {answers[0]}
                        <span className="opacity-50">/{high}</span>
                    </span>
                </span>
            );
        }

        case QUESTION_TYPE.CHOICE:
            return (
                <span className="flex flex-wrap gap-1">
                    {answers.map((value) => (
                        <Chip key={value}>{value}</Chip>
                    ))}
                </span>
            );

        case QUESTION_TYPE.RADIO:
        case QUESTION_TYPE.DROP_DOWN:
            return <Chip>{answers[0]}</Chip>;

        case QUESTION_TYPE.DATE:
        case QUESTION_TYPE.TIME:
            return (
                <span className="text-theme-form-on-surface text-xs">
                    {new Date(answers[0]).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            );

        case QUESTION_TYPE.PARAGRAPH:
        case QUESTION_TYPE.TEXT:
        default:
            return (
                <span className="text-theme-form-on-surface text-xs whitespace-pre-wrap">
                    <Clamped text={answers.join(', ')} />
                </span>
            );
    }
}
