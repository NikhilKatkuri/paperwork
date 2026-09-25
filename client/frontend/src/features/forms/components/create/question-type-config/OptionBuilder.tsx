'use client';

import { useEffect, useState } from 'react';
import { useFormCreate } from '../../../providers/FormCreate';
import { OptionType, QUESTION_TYPE } from '../../common/types';
import { Option } from '@/features/forms/types/question.type';

const ICON_MAP: Record<OptionType, string> = {
    RADIO: 'radio_button_unchecked',
    CHOICE: 'check_box_outline_blank',
    DROP_DOWN: '',
};

interface OptionBuilderProps {
    type: OptionType;
    onOptionsChange: (options: Option[]) => void;
    id: number;
}

function OptionBuilder({
    id,
    type,
    onOptionsChange,
}: Readonly<OptionBuilderProps>) {
    const { questions } = useFormCreate();

    // 1. Derive or initialize state correctly
    const [options, setOptions] = useState<Option[]>(() => {
        const question = questions.get(id);
        return question?.options && question.options.length > 0
            ? question.options
            : [{ index: 1, label: 'Option 1' }];
    });

    // 2. Keep local options in sync if question ID changes
    useEffect(() => {
        function syncOptions() {
            const question = questions.get(id);
            if (question?.options) {
                setOptions(question.options);
            }
        }
        syncOptions();
    }, [id, questions]);

    const handleUpdateOption = (targetIndex: number, value: string) => {
        // Split by commas and remove empty values
        const parts = value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        // Normal typing (no comma)
        if (parts.length <= 1) {
            const newOptions = options.map((opt, i) =>
                i === targetIndex ? { ...opt, label: value } : opt
            );

            setOptions(newOptions);
            onOptionsChange(newOptions);
            return;
        }

        // Comma-separated input → create multiple options
        const newOptions = [
            ...options.slice(0, targetIndex),
            ...parts.map((label, i) => ({
                index: targetIndex + i + 1,
                label,
            })),
            ...options.slice(targetIndex + 1),
        ].map((opt, i) => ({
            ...opt,
            index: i + 1,
        }));

        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const handleAddOption = () => {
        const nextIndex = options.length + 1;
        const newOptions: Option[] = [
            ...options,
            {
                index: nextIndex,
                label: `Option ${nextIndex}`,
            },
        ];
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    // 3. Delete by array index instead of label matching
    const handleDeleteOption = (targetIndex: number) => {
        if (options.length <= 1) return; // Guard clause

        const newOptions = options
            .filter((_, i) => i !== targetIndex)
            .map((opt, i) => ({ ...opt, index: i + 1 })); // Re-index remaining options

        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    return (
        <div className="grid w-full max-w-lg grid-cols-1 gap-2">
            {options.map((option, index) => (
                <div
                    // 4. Stable key using index prevents cursor focus loss on re-render
                    key={`option-${id}-${index}`}
                    className="group flex h-10 items-center gap-2 pl-2"
                >
                    {type === QUESTION_TYPE.DROP_DOWN ? (
                        <p className="w-5 text-right">{index + 1}.</p>
                    ) : (
                        <span className="material-symbols-outlined text-theme-form-on-container/90">
                            {ICON_MAP[type]}
                        </span>
                    )}
                    <input
                        type="text"
                        value={option.label}
                        onChange={(e) =>
                            handleUpdateOption(index, e.target.value)
                        }
                        className="bg-theme-form-container text-theme-form-on-container/90 focus:border-theme-form-container-border w-full rounded-md px-2 py-1 text-sm focus:outline-none"
                    />

                    {options.length > 1 && (
                        <button
                            type="button"
                            onClick={() => handleDeleteOption(index)}
                            className="material-symbols-outlined rounded p-1 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
                            aria-label="Delete option"
                        >
                            close
                        </button>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={handleAddOption}
                className="flex h-10 w-fit items-center gap-2 rounded px-2 transition-colors hover:bg-gray-100"
            >
                {type === QUESTION_TYPE.DROP_DOWN ? (
                    <p className="w-5 text-right">{options.length + 1}.</p>
                ) : (
                    <span className="material-symbols-outlined text-theme-form-on-container/90">
                        {ICON_MAP[type]}
                    </span>
                )}

                <p className="text-theme-form-on-container/70 pl-2 text-sm">
                    Add Option
                </p>
            </button>
        </div>
    );
}

export default OptionBuilder;
