'use client';

import { useForm } from '@/features/forms/providers/form';
import {
    ChoiceQuestion,
    QuestionOption,
    QuestionOptionConfig,
    QuestionTypeEnum,
} from '@paperwork/types';
import { useEffect, useState } from 'react';

const ICON_MAP: Record<ChoiceQuestion['type'], string> = {
    [QuestionTypeEnum.RADIO]: 'radio_button_unchecked',
    [QuestionTypeEnum.CHOICE]: 'check_box_outline_blank',
    [QuestionTypeEnum.DROP_DOWN]: '',
};

interface ChoiceEditorProps {
    type: ChoiceQuestion['type'];
    onChange: (options: QuestionOptionConfig) => void;
    id: string;
}

function ChoiceEditor({
    id,
    type,
    onChange,
}: Readonly<ChoiceEditorProps>) {
    const { getQuestionById } = useForm();

    const [options, setOptions] = useState<QuestionOption[]>(() => {
        
        const question = getQuestionById(id) as ChoiceQuestion | undefined;
        return question?.options && question.options.length > 0
            ? question.options
            : [{ index: 1, label: 'Option 1' }];
    });

    useEffect(() => {
        function syncOptions() {
            const question = getQuestionById(id) as ChoiceQuestion | undefined;
            if (question?.options) {
                setOptions(question.options);
            }
        }
        syncOptions();
    }, [id, getQuestionById]);

    const handleUpdateOption = (targetIndex: number, value: string) => { 
        const newOptions = options.map((opt, i) =>
            i === targetIndex ? { ...opt, label: value } : opt
        );

        setOptions(newOptions);
        onChange({ options: newOptions });
    };

    const handlePasteOption = (
        targetIndex: number,
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        const pasteData = e.clipboardData.getData('text');

        const parts = pasteData
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean);

        if (parts.length > 1) {
            e.preventDefault();

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
            onChange({ options: newOptions });
        }
    };

    const handleAddOption = () => {
        const nextIndex = options.length + 1;
        const newOptions: QuestionOption[] = [
            ...options,
            {
                index: nextIndex,
                label: `Option ${nextIndex}`,
            },
        ];
        setOptions(newOptions);
        onChange({ options: newOptions });
    };

    const handleDeleteOption = (targetIndex: number) => {
        if (options.length <= 1) return;

        const newOptions = options
            .filter((_, i) => i !== targetIndex)
            .map((opt, i) => ({ ...opt, index: i + 1 }));

        setOptions(newOptions);
        onChange({ options: newOptions });
    };

    return (
        <div className="grid w-full max-w-lg grid-cols-1 gap-2">
            {options.map((option, index) => (
                <div
                    key={`option-${id}-${index}`}
                    className="group flex h-10 items-center gap-2 pl-2"
                >
                    {type === QuestionTypeEnum.DROP_DOWN ? (
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
                        onPaste={(e) => handlePasteOption(index, e)}
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
                {type === QuestionTypeEnum.DROP_DOWN ? (
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

export default ChoiceEditor;
