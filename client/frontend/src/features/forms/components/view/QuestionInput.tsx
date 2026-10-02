'use client';

import { QUESTION_TYPE } from '../../types/question.type';
import type { FillQuestion, Option } from '../../types/fill.type';

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

const FIELD =
    'w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-current';
const FIELD_IDLE =
    'border-theme-form-on-surface/30 text-theme-form-on-surface placeholder:text-theme-form-on-surface/40';

/**
 * Renders the control for a question type.
 *
 * `values` is always a list so CHOICE (multi) and everything else (single) share
 * one shape - the API takes `values: string[]` regardless.
 */
export default function QuestionInput({
    question,
    values,
    onChange,
    invalid,
}: Readonly<QuestionInputProps>) {
    const border = invalid
        ? 'border-red-500 text-red-600 dark:border-red-400'
        : FIELD_IDLE;

    const options: Option[] = question.optionsConfig?.options ?? [];
    const selected = values[0] ?? '';
    const selectedSet = new Set(values);

    const setSingle = (value: string) => onChange(value ? [value] : []);

    const toggleMulti = (value: string) => {
        if (selectedSet.has(value)) {
            onChange(values.filter((v) => v !== value));
        } else {
            onChange([...values, value]);
        }
    };

    switch (question.type) {
        case QUESTION_TYPE.PARAGRAPH:
            return (
                <textarea
                    rows={4}
                    value={selected}
                    placeholder={question.placeholder}
                    onChange={(e) => setSingle(e.target.value)}
                    className={`${FIELD} ${border} resize-y`}
                />
            );

        case QUESTION_TYPE.DATE:
            return (
                <input
                    type="date"
                    value={selected}
                    onChange={(e) => setSingle(e.target.value)}
                    className={`${FIELD} ${border}`}
                />
            );

        case QUESTION_TYPE.TIME:
            return (
                <input
                    type="time"
                    value={selected}
                    onChange={(e) => setSingle(e.target.value)}
                    className={`${FIELD} ${border}`}
                />
            );

        case QUESTION_TYPE.CHOICE:
            return (
                <div className="flex flex-col gap-2">
                    {options.map((option) => {
                        const checked = selectedSet.has(option.label);

                        return (
                            <label
                                key={option.index}
                                className={`hover:bg-theme-form-on-surface/5 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                                    checked
                                        ? 'border-theme-form-container-active bg-theme-form-container-active/10'
                                        : 'border-theme-form-on-surface/20'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleMulti(option.label)}
                                    className="accent-current"
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            );

        case QUESTION_TYPE.RADIO:
            return (
                <div className="flex flex-col gap-2">
                    {options.map((option) => (
                        <label
                            key={option.index}
                            className={`hover:bg-theme-form-on-surface/5 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                                selected === option.label
                                    ? 'border-theme-form-container-active bg-theme-form-container-active/10'
                                    : 'border-theme-form-on-surface/20'
                            }`}
                        >
                            <input
                                type="radio"
                                name={question._id}
                                checked={selected === option.label}
                                onChange={() => setSingle(option.label)}
                                className="accent-current"
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
            );

        case QUESTION_TYPE.DROP_DOWN:
            return (
                <select
                    value={selected}
                    onChange={(e) => setSingle(e.target.value)}
                    className={`${FIELD} ${border}`}
                >
                    <option value="">Select an option</option>
                    {options.map((option) => (
                        <option key={option.index} value={option.label}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );

        case QUESTION_TYPE.LINEAR_SCALE: {
            const low = 1;
            const high = Math.max(
                2,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const points = Array.from(
                { length: high - low + 1 },
                (_, i) => low + i
            );

            return (
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        {points.map((point) => (
                            <button
                                key={point}
                                type="button"
                                onClick={() => setSingle(String(point))}
                                className={`h-10 w-10 rounded-full border text-sm transition-colors ${
                                    selected === String(point)
                                        ? 'border-theme-form-container-active bg-theme-form-container-active text-white'
                                        : 'border-theme-form-on-surface/30 hover:bg-theme-form-on-surface/10'
                                }`}
                            >
                                {point}
                            </button>
                        ))}
                    </div>
                    <div className="text-theme-form-on-surface/60 mt-1 flex justify-between text-xs">
                        <span>
                            {question.ratingConfig?.lowLabel ?? String(low)}
                        </span>
                        <span>
                            {question.ratingConfig?.highLabel ?? String(high)}
                        </span>
                    </div>
                </div>
            );
        }

        case QUESTION_TYPE.RATING: {
            const scale = Math.max(
                1,
                Math.min(Number(question.ratingConfig?.scale) || 5, 10)
            );
            const icon = RATING_ICONS[question.ratingConfig?.icon ?? 'STAR'];

            return (
                <div>
                    <div className="flex flex-wrap items-center gap-1">
                        {Array.from({ length: scale }, (_, i) => i + 1).map(
                            (point) => (
                                <button
                                    key={point}
                                    type="button"
                                    aria-label={`${point} of ${scale}`}
                                    aria-pressed={selected === String(point)}
                                    onClick={() => setSingle(String(point))}
                                    className={`material-symbols-outlined p-1 text-3xl transition-transform hover:scale-110 ${
                                        selected === String(point)
                                            ? 'text-theme-form-container-active'
                                            : 'text-theme-form-on-surface/40'
                                    }`}
                                >
                                    {icon}
                                </button>
                            )
                        )}
                    </div>
                    {question.ratingConfig?.lowLabel ||
                    question.ratingConfig?.highLabel ? (
                        <div className="text-theme-form-on-surface/60 mt-1 flex justify-between text-xs">
                            <span>{question.ratingConfig?.lowLabel}</span>
                            <span>{question.ratingConfig?.highLabel}</span>
                        </div>
                    ) : null}
                </div>
            );
        }

        case QUESTION_TYPE.TEXT:
        default:
            return (
                <input
                    type="text"
                    value={selected}
                    placeholder={question.placeholder}
                    onChange={(e) => setSingle(e.target.value)}
                    className={`${FIELD} ${border}`}
                />
            );
    }
}
