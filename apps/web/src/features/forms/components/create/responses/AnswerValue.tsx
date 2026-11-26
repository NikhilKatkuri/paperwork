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
                className="text-on-brand-light font-medium hover:underline"
            >
                {open ? 'Show less' : 'Show more'}
            </button>
        </span>
    );
}

function Chip({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <span className="bg-brand-light text-on-brand-light inline-block max-w-full rounded-xl px-2.5 py-0.5 text-xs font-medium">
            {children}
        </span>
    );
}

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
        return (
            <span className="text-theme-on-surface/40 text-xs">No answer</span>
        );
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
                    className="text-on-brand-light inline-flex items-center gap-0.5"
                    aria-label={`${answers[0]} out of ${scale}`}
                >
                    {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
                        <span
                            key={n}
                            className={`material-symbols-outlined text-base ${
                                n <= picked ? '' : 'opacity-20'
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
                <span className="inline-flex items-center gap-2.5">
                    <span className="bg-theme-on-surface/10 relative inline-block h-1.5 w-24 overflow-hidden rounded-full">
                        <span
                            className="bg-brand absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${pct}%` }}
                        />
                    </span>
                    <span className="text-theme-on-surface text-xs font-medium tabular-nums">
                        {answers[0]}
                        <span className="text-theme-on-surface/45">
                            /{upper}
                        </span>
                    </span>
                </span>
            );
        }

        case QuestionTypeEnum.CHOICE:
            return (
                <span className="flex flex-wrap gap-1.5">
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
                <span className="text-theme-on-surface text-xs">
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
                <span className="text-theme-on-surface text-xs tabular-nums">
                    {answers[0]}
                </span>
            );

        case QuestionTypeEnum.PARAGRAPH:
        case QuestionTypeEnum.TEXT:
        default:
            return (
                <span className="text-theme-on-surface text-xs whitespace-pre-wrap">
                    <Clamped text={answers.join(', ')} />
                </span>
            );
    }
}
