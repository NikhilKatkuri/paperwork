'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities'; 
import { QUESTION_TYPE, QuestionType, questionTypesMap } from '../../common/types';
import QuestionTooling from './QuestionTooling'; 
import { cn } from '@/utils/cn';
import QuestionCore from '@/features/forms/types/question.type';
import { useFormCreate } from '@/features/forms/providers/FormCreate';
import AnswerTemplate from '../question-type-config/AnswerTemplate';
import RichTextInput from '../../common/RichTextInput';
 

interface InputFieldProps {
    id: number;
    initialType?: QuestionType;
    index?: number;
    isOverlay?: boolean;
    sectionIdx: number;
}

const OVERLAY_FALLBACK: QuestionCore = {
    index: 0,
    type: QUESTION_TYPE.TEXT,
    question: 'Untitled Question',
    isRequired: false,
    helpText: undefined,
    sectionIdx: 0
};

export default function InputField({
    id,
    initialType = QUESTION_TYPE.TEXT,
    index = 0,
    sectionIdx = 0,
    isOverlay = false,
}: InputFieldProps) {
    const [mounted, setMounted] = useState(false);
    const { updateQuestion, questions } = useFormCreate();

    const config = questions.get(id) ?? {
        ...OVERLAY_FALLBACK,
        type: initialType,
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    const [menuStyle, setMenuStyle] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 0 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentOption = questionTypesMap[config.type];

    const sortable = useSortable({ id, disabled: isOverlay });
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = sortable;

    const style = isOverlay
        ? undefined
        : {
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.4 : 1,
          };

    useEffect(() => {
        function setMountedTrue() {
            setMounted(true);
        }
        setMountedTrue();
    }, []);

    const updatePosition = useCallback(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMenuStyle({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, []);

    useEffect(() => {
        if (!isDropdownOpen) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isDropdownOpen, updatePosition]);

    useEffect(() => {
        if (!isDropdownOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setIsDropdownOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsDropdownOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDropdownOpen]);

    return (
        <div
            id={`section-${sectionIdx}:question-${index}`}
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className={cn(
                'floating-toolbar-selector group/question-body bg-theme-form-container before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border relative flex w-full flex-col rounded-xl p-3',
                'hover:before:bg-theme-form-container-border before:absolute before:top-0 before:left-0 before:z-50 before:h-full before:w-2 before:rounded-l-xl before:transition-all before:duration-200 before:ease-in-out'
            )}
        >
            <div className="flex items-center justify-center">
                <button
                    type="button"
                    aria-label="Drag handle"
                    {...(isOverlay ? {} : attributes)}
                    {...(isOverlay ? {} : listeners)}
                >
                    <span className="material-symbols-outlined rotate-90 cursor-grab text-gray-400">
                        drag_indicator
                    </span>
                </button>
            </div>

            <div className="relative flex items-start max-md:flex-wrap md:gap-3">
                <div className="flex-1">
                    <RichTextInput
                        placeholder="Untitled Question"
                        className="h-8"
                        value={config.question}
                        onChange={(value) =>
                            updateQuestion(id, { question: value })
                        }
                    />
                </div>

                <div
                    className="relative w-full max-md:mt-2 md:w-54"
                    ref={wrapperRef}
                >
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                        className="border-theme-form-container-border active:bg-theme-form-container-hover flex h-12 w-full items-center justify-between rounded-md border p-2 text-sm"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="material-symbols-outlined text-[20px]">
                                {currentOption.icon}
                            </span>
                            <span className="truncate">
                                {currentOption.label}
                            </span>
                        </div>
                        <span className="material-symbols-outlined text-[20px]">
                            arrow_drop_down
                        </span>
                    </button>

                    {mounted &&
                        isDropdownOpen &&
                        createPortal(
                            <div
                                ref={menuRef}
                                role="listbox"
                                style={{
                                    position: 'absolute',
                                    top: menuStyle.top,
                                    left: menuStyle.left,
                                    width: menuStyle.width,
                                }}
                                className="bg-theme-form-container border-theme-form-container-border z-50 flex flex-col rounded-lg border p-1 shadow-lg"
                            >
                                {(
                                    Object.keys(
                                        questionTypesMap
                                    ) as QuestionType[]
                                ).map((key) => {
                                    const option = questionTypesMap[key];
                                    const isSelected = key === config.type;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                updateQuestion(id, {
                                                    type: key,
                                                });
                                                setShowMoreOptions(false);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`hover:bg-theme-form-container-hover flex h-10 w-full items-center gap-2 rounded-md p-2 text-left text-sm ${
                                                isSelected
                                                    ? 'bg-theme-form-container-hover font-medium'
                                                    : ''
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {option.icon}
                                            </span>
                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>,
                            document.body
                        )}
                </div>
            </div>

            {config.helpText !== undefined && (
                <div className="flex-1">
                    <RichTextInput
                        placeholder="Help text (optional)"
                        className="h-8"
                        value={config.helpText ?? ''}
                        onChange={(value) =>
                            updateQuestion(id, { helpText: value })
                        }
                    />
                </div>
            )}

            <AnswerTemplate id={id} type={config.type} update={(patch) => updateQuestion(id, patch)} />
            <QuestionTooling
                id={id}
                sectionIdx={0}
                isRequired={config.isRequired ?? false}
                showMoreOptions={showMoreOptions}
                setShowMoreOptions={() => setShowMoreOptions(!showMoreOptions)}
                updateConfig={(patch: Partial<QuestionCore>) =>
                    updateQuestion(id, patch)
                }
                helpText={config.helpText}
            />
        </div>
    );
}
