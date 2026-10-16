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
    const { getQuestionById, sectionsMap, sectionOrder } = useForm();

    const [options, setOptions] = useState<QuestionOption[]>(() => {
        const question = getQuestionById(id) as ChoiceQuestion | undefined;
        const stored =
            question?.optionsConfig?.options?.length
                ? question.optionsConfig.options
                : question?.options?.length
                  ? question.options
                  : null;
        return stored && stored.length > 0
            ? stored
            : [{ index: 1, label: 'Option 1' }];
    });

    // Navigation targets: every section except the option's own (a section
    // cannot jump to itself). Ordered as authored.
    const currentSectionId = getQuestionById(id)?.sectionId;
    const targets = sectionOrder
        .map((sid) => sectionsMap.get(sid))
        .filter((s) => s && s.id !== currentSectionId)
        .map((s) => ({ id: s!.id, title: s!.title || 'Untitled section' }));

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

    /** "Go to section based on answer" for one option. */
    const optionTarget = (option: QuestionOption): string => {
        const action = option.action;
        if (!action || action.type === 'NEXT_SECTION') return '';
        if (action.type === 'SUBMIT_FORM') return 'SUBMIT_FORM';
        return action.targetSectionId ?? '';
    };

    const handleOptionTarget = (targetIndex: number, target: string) => {
        const newOptions = options.map((opt, i) => {
            if (i !== targetIndex) return opt;
            if (!target) {
                const rest: QuestionOption = { ...opt };
                delete rest.action;
                return rest;
            }
            return {
                ...opt,
                action:
                    target === 'SUBMIT_FORM'
                        ? { type: 'SUBMIT_FORM' as const }
                        : {
                              type: 'GO_TO_SECTION' as const,
                              targetSectionId: target,
                          },
            };
        });

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
                        aria-label={`Option ${index + 1}`}
                        className="bg-theme-form-container text-theme-form-on-container/90 focus:border-theme-form-container-border w-full min-w-0 flex-1 rounded-md px-2 py-1 text-sm focus:outline-none"
                    />

                    <select
                        value={optionTarget(option)}
                        onChange={(e) =>
                            handleOptionTarget(index, e.target.value)
                        }
                        aria-label={`After "${option.label || `Option ${index + 1}`}", go to`}
                        title="Go to section based on this answer"
                        className="border-theme-form-container-border text-theme-form-on-container/70 max-w-32 shrink-0 rounded-md border bg-transparent px-1 py-1 text-xs outline-none"
                    >
                        <option value="">→ Next</option>
                        <option value="SUBMIT_FORM">→ Submit</option>
                        {targets.map((t) => (
                            <option key={t.id} value={t.id}>
                                → {t.title}
                            </option>
                        ))}
                    </select>

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
