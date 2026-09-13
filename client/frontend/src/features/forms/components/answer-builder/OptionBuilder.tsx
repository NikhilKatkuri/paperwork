'use client';
import { useState } from 'react';
import { OptionType, QUESTION_TYPE } from '../Question-builder/types';

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    } 
    
    return Math.random().toString(36).substring(2, 11);
};

const ICON_MAP: Record<OptionType, string> = {
    RADIO: 'radio_button_unchecked',
    CHOICE: 'check_box_outline_blank',
    [QUESTION_TYPE.DROP_DOWN]: '',
};

interface OptionBuilderProps {
    type: OptionType;
    onOptionsChange?: (options: { id: string; value: string }[]) => void;
}

function OptionBuilder({ type, onOptionsChange }: OptionBuilderProps) {
    const [options, setOptions] = useState(() => [
        { id: generateId(), value: 'Option 1' },
    ]);

    const handleAddOption = () => {
        const newOptions = [
            ...options,
            { id: generateId(), value: `Option ${options.length + 1}` },
        ];
        setOptions(newOptions);
        onOptionsChange?.(newOptions);
    };

    const handleUpdateOption = (index: number, newValue: string) => {
        const newOptions = [...options];
        newOptions[index].value = newValue;
        setOptions(newOptions);
        onOptionsChange?.(newOptions);
    };

    const handleDeleteOption = (id: string) => {
        const newOptions = options.filter((opt) => opt.id !== id);
        setOptions(newOptions);
        onOptionsChange?.(newOptions);
    };

    return (
        <div className="grid w-full max-w-lg grid-cols-1 gap-2">
            {options.map((option, index) => (
                <div
                    key={option.id}
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
                        value={option.value}
                        onChange={(e) =>
                            handleUpdateOption(index, e.target.value)
                        }
                        className="bg-theme-form-container text-theme-form-on-container/90 focus:border-theme-form-container-border w-full rounded-md px-2 py-1 text-sm focus:outline-none"
                    /> 
                    
                    {options.length > 1 && (
                        <button
                            onClick={() => handleDeleteOption(option.id)}
                            className="material-symbols-outlined rounded p-1 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
                            aria-label="Delete option"
                        >
                            close
                        </button>
                    )}
                </div>
            ))}

            <button
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
                    Add Option or{' '}
                    <span className="text-blue-600 hover:underline">{`add "other"`}</span>
                </p>
            </button>
        </div>
    );
}

export default OptionBuilder;
