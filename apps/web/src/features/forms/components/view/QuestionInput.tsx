'use client';

import { cn } from '@/utils/cn';
import { useId, useState } from 'react';
import { FillQuestion } from '../../types/fill.type';
import { QuestionOption, QuestionTypeEnum } from '@paperwork/types';

interface QuestionInputProps {
    question: FillQuestion;
    values: string[];
    onChange: (values: string[]) => void;
    invalid?: boolean;
}

const RATING_ICONS: Record<string, string> = {
    STAR: 'star',
    HEART: 'favorite',
    THUMB_UP: 'thumb_up',
};

const BARE_INPUT =
    'w-full bg-transparent py-2 text-sm text-theme-form-on-surface outline-none placeholder:text-theme-form-on-surface/50';

function Underline({ invalid }: Readonly<{ invalid?: boolean }>) {
    return (
        <>
            <div
                className={cn(
                    'h-px w-full',
                    invalid
                        ? 'bg-red-500 dark:bg-red-400'
                        : 'bg-theme-form-container-border'
                )}
            />
            <div
                className={cn(
                    'pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 transition-all duration-300 group-focus-within:w-full',
                    invalid
                        ? 'bg-red-500 dark:bg-red-400'
                        : 'bg-theme-form-container-active'
                )}
            />
        </>
    );
}

function RadioMark() {
    return (
        <>
            <span className="group-hover:bg-theme-form-on-surface/10 peer-focus-visible:bg-theme-form-container-active/20 absolute inset-0 rounded-full transition-colors" />
            <span className="border-theme-form-on-surface/60 peer-checked:border-theme-form-container-active relative h-5 w-5 rounded-full border-2 transition-colors" />
            <span className="bg-theme-form-container-active absolute h-2.5 w-2.5 scale-0 rounded-full transition-transform duration-150 peer-checked:scale-100" />
        </>
    );
}

function CheckMark() {
    return (
        <>
            <span className="group-hover:bg-theme-form-on-surface/10 peer-focus-visible:bg-theme-form-container-active/20 absolute inset-0 rounded-full transition-colors" />
            <span className="border-theme-form-on-surface/60 peer-checked:border-theme-form-container-active peer-checked:bg-theme-form-container-active relative h-4.5 w-4.5 rounded-xs border-2 transition-colors" />
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="text-theme-form-on-active absolute h-3.5 w-3.5 scale-0 transition-transform duration-150 peer-checked:scale-100"
                fill="none"
                stroke="currentColor"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 12.5l5 5L20 6.5" />
            </svg>
        </>
    );
}

export default function QuestionInput({
    question,
    values,
    onChange,
    invalid,
}: Readonly<QuestionInputProps>) {
    const inputId = useId();
    const [hoverRating, setHoverRating] = useState(0);

    const options: QuestionOption[] = question.optionsConfig?.options ?? [];
    const selected = values[0] ?? '';
    const selectedSet = new Set(values);
    const placeholder = question.placeholder ?? 'Your answer';
    const fieldId = `q-${question._id}-${inputId}`;

    const setSingle = (value: string) => onChange(value ? [value] : []);

    const toggleMulti = (value: string) => {
        if (selectedSet.has(value)) {
            onChange(values.filter((v) => v !== value));
        } else {
            onChange([...values, value]);
        }
    };

    switch (question.type) {
        case QuestionTypeEnum.PARAGRAPH:
            return (
                <div className="group relative w-full">
                    <label htmlFor={fieldId} className="sr-only">
                        {placeholder}
                    </label>
                    <textarea
                        id={fieldId}
                        rows={1}
                        value={selected}
                        placeholder={placeholder}
                        onChange={(e) => setSingle(e.target.value)}
                        onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                        }}
                        aria-invalid={invalid || undefined}
                        className={cn(
                            BARE_INPUT,
                            'resize-none overflow-hidden'
                        )}
                    />
                    <Underline invalid={invalid} />
                </div>
            );

        case QuestionTypeEnum.DATE:
            return (
                <div className="group relative w-full max-w-xs">
                    <label htmlFor={fieldId} className="sr-only">
                        Date
                    </label>
                    <input
                        type="date"
                        id={fieldId}
                        value={selected}
                        onChange={(e) => setSingle(e.target.value)}
                        aria-invalid={invalid || undefined}
                        className={cn(BARE_INPUT, 'dark:scheme-dark')}
                    />
                    <Underline invalid={invalid} />
                </div>
            );

        case QuestionTypeEnum.TIME:
            return (
                <div className="group relative w-full max-w-xs">
                    <label htmlFor={fieldId} className="sr-only">
                        Time
                    </label>
                    <input
                        type="time"
                        id={fieldId}
                        value={selected}
                        onChange={(e) => setSingle(e.target.value)}
                        aria-invalid={invalid || undefined}
                        className={cn(BARE_INPUT, 'dark:scheme-dark')}
                    />
                    <Underline invalid={invalid} />
                </div>
            );

        case QuestionTypeEnum.CHOICE:
            return (
                <div className="text-theme-form-on-surface flex flex-col">
                    {options.map((option) => (
                        <label
                            key={option.index}
                            className="group flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={selectedSet.has(option.label)}
                                    onChange={() => toggleMulti(option.label)}
                                    className="peer sr-only"
                                />
                                <CheckMark />
                            </span>
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            );

        case QuestionTypeEnum.RADIO:
            return (
                <div
                    role="radiogroup"
                    className="text-theme-form-on-surface flex flex-col"
                >
                    {options.map((option) => (
                        <label
                            key={option.index}
                            className="group flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                                <input
                                    type="radio"
                                    name={question._id}
                                    checked={selected === option.label}
                                    onChange={() => setSingle(option.label)}
                                    className="peer sr-only"
                                />
                                <RadioMark />
                            </span>
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            );

        case QuestionTypeEnum.DROP_DOWN:
            return (
                <div className="relative w-full max-w-xs">
                    <label htmlFor={fieldId} className="sr-only">
                        Choose an option
                    </label>
                    <select
                        id={fieldId}
                        value={selected}
                        onChange={(e) => setSingle(e.target.value)}
                        aria-invalid={invalid || undefined}
                        className={cn(
                            'w-full cursor-pointer appearance-none rounded border bg-transparent py-3 pr-10 pl-3 text-sm transition-colors outline-none',
                            'focus:border-theme-form-container-active focus:ring-theme-form-container-active focus:ring-1',
                            invalid
                                ? 'border-red-500 dark:border-red-400'
                                : 'border-theme-form-container-border',
                            selected
                                ? 'text-theme-form-on-surface'
                                : 'text-theme-form-on-surface/60'
                        )}
                    >
                        <option value="">Choose</option>
                        {options.map((option) => (
                            <option key={option.index} value={option.label}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="text-theme-form-on-surface/60 pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
                        fill="currentColor"
                    >
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                </div>
            );

        case QuestionTypeEnum.LINEAR_SCALE: {
            const low = 1;
            const high = Math.max(
                2,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const points = Array.from(
                { length: high - low + 1 },
                (_, i) => low + i
            );
            const lowLabel = question.ratingConfig?.lowLabel;
            const highLabel = question.ratingConfig?.highLabel;

            return (
                <div className="text-theme-form-on-surface overflow-x-auto">
                    <div
                        role="radiogroup"
                        className="flex min-w-max items-end gap-2 sm:gap-4"
                    >
                        {lowLabel ? (
                            <span className="max-w-24 pb-2.5 text-sm wrap-break-word">
                                {lowLabel}
                            </span>
                        ) : null}

                        <div className="flex items-end">
                            {points.map((point) => (
                                <label
                                    key={point}
                                    className="group flex w-10 cursor-pointer flex-col items-center sm:w-12"
                                >
                                    <span className="text-sm">{point}</span>
                                    <span className="relative flex h-10 w-10 items-center justify-center">
                                        <input
                                            type="radio"
                                            name={`${question._id}-${inputId}`}
                                            checked={selected === String(point)}
                                            onChange={() =>
                                                setSingle(String(point))
                                            }
                                            className="peer sr-only"
                                        />
                                        <RadioMark />
                                    </span>
                                </label>
                            ))}
                        </div>

                        {highLabel ? (
                            <span className="max-w-24 pb-2.5 text-sm wrap-break-word">
                                {highLabel}
                            </span>
                        ) : null}
                    </div>
                </div>
            );
        }

        case QuestionTypeEnum.RATING: {
            const scale = Math.max(
                1,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const icon = RATING_ICONS[question.ratingConfig?.icon ?? 'STAR'];
            const current = Number(selected) || 0;
            const shown = hoverRating || current;
            const lowLabel = question.ratingConfig?.lowLabel;
            const highLabel = question.ratingConfig?.highLabel;

            return (
                <div>
                    <div
                        className="flex flex-wrap items-center"
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        {Array.from({ length: scale }, (_, i) => i + 1).map(
                            (point) => {
                                const filled = point <= shown;

                                return (
                                    <button
                                        key={point}
                                        type="button"
                                        role="radio"
                                        aria-label={`${point} of ${scale}`}
                                        aria-checked={current === point}
                                        onMouseEnter={() =>
                                            setHoverRating(point)
                                        }
                                        onFocus={() => setHoverRating(point)}
                                        onBlur={() => setHoverRating(0)}
                                        onClick={() =>
                                            setSingle(
                                                current === point
                                                    ? ''
                                                    : String(point)
                                            )
                                        }
                                        className={cn(
                                            'material-symbols-outlined hover:bg-theme-form-on-surface/10 rounded-full p-1.5 text-4xl transition-colors',
                                            filled
                                                ? 'text-theme-form-container-active'
                                                : 'text-theme-form-on-surface/40'
                                        )}
                                        style={{
                                            fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
                                        }}
                                    >
                                        {icon}
                                    </button>
                                );
                            }
                        )}
                    </div>

                    {lowLabel || highLabel ? (
                        <div className="text-theme-form-on-surface/60 mt-1 flex justify-between text-xs">
                            <span>{lowLabel}</span>
                            <span>{highLabel}</span>
                        </div>
                    ) : null}
                </div>
            );
        }

        case QuestionTypeEnum.TEXT:
        default:
            return (
                <div className="group relative w-full">
                    <label htmlFor={fieldId} className="sr-only">
                        {placeholder}
                    </label>
                    <input
                        type="text"
                        id={fieldId}
                        value={selected}
                        placeholder={placeholder}
                        onChange={(e) => setSingle(e.target.value)}
                        aria-invalid={invalid || undefined}
                        className={BARE_INPUT}
                    />
                    <Underline invalid={invalid} />
                </div>
            );
    }
}
