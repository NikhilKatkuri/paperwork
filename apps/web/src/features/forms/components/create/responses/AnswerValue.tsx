'use client';

import {
    QuestionDoc,
    QuestionTypeEnum,
    AnswerValue as AnswerValueType,
} from '@paperwork/types';
import { useState } from 'react';

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
                className="font-medium text-neutral-900 hover:underline"
            >
                {open ? 'Show less' : 'Show more'}
            </button>
        </span>
    );
}

function Chip({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <span className="inline-block max-w-full rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-800">
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
    values: AnswerValueType;
    question?: QuestionDoc;
}>) {
    const answers = (Array.isArray(values) ? values : [values])
        .map(String)
        .filter((v) => v.trim());

    if (!answers.length) {
        return <span className="text-xs text-neutral-400">No answer</span>;
    }

    switch (question?.type) {
        case QuestionTypeEnum.RATING: {
            const scale = Math.max(
                1,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const picked = Number(answers[0]);
            const icon = RATING_ICONS[question.ratingConfig?.icon ?? 'STAR'];

            return (
                <span
                    className="inline-flex items-center gap-0.5 text-neutral-900"
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

        case QuestionTypeEnum.LINEAR_SCALE: {
            const value = Number(answers[0]);
            // Linear scales carry their own bounds; fall back to the legacy
            // rating scale only for responses stored before scaleConfig.
            const lower = Number(question.scaleConfig?.lowerBound ?? 1);
            const upper = Number(
                question.scaleConfig?.upperBound ??
                    question.ratingConfig?.scale ??
                    5
            );
            const span = Math.max(1, upper - lower);
            const pct = Math.min(
                100,
                Math.max(0, ((value - lower) / span) * 100)
            );

            return (
                <span className="inline-flex items-center gap-2">
                    <span className="relative inline-block h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                        <span
                            className="absolute inset-y-0 left-0 rounded-full bg-neutral-900"
                            style={{ width: `${pct}%` }}
                        />
                    </span>
                    <span className="text-xs font-medium text-neutral-900">
                        {answers[0]}
                        <span className="text-neutral-400">/{upper}</span>
                    </span>
                </span>
            );
        }

        case QuestionTypeEnum.CHOICE:
            return (
                <span className="flex flex-wrap gap-1">
                    {answers.map((value) => (
                        <Chip key={value}>{value}</Chip>
                    ))}
                </span>
            );

        case QuestionTypeEnum.RADIO:
        case QuestionTypeEnum.DROP_DOWN:
            return <Chip>{answers[0]}</Chip>;

        case QuestionTypeEnum.DATE: {
            const parsed = new Date(answers[0]);
            return (
                <span className="text-xs text-neutral-900">
                    {Number.isNaN(parsed.getTime())
                        ? answers[0]
                        : parsed.toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                          })}
                </span>
            );
        }

        case QuestionTypeEnum.TIME:
            return (
                <span className="text-xs tabular-nums text-neutral-900">
                    {answers[0]}
                </span>
            );

        case QuestionTypeEnum.PARAGRAPH:
        case QuestionTypeEnum.TEXT:
        default:
            return (
                <span className="text-xs whitespace-pre-wrap text-neutral-900">
                    <Clamped text={answers.join(', ')} />
                </span>
            );
    }
}
