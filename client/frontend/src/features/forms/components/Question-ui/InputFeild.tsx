'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextInput from './RichTextInput';
import Toggle from '../Toggle';

export enum QUESTION_TYPE {
    TEXT = 'TEXT',
    PARAGRAPH = 'PARAGRAPH',
    DATE = 'DATE',
    TIME = 'TIME',
    CHOICE = 'CHOICE',
    RADIO = 'RADIO',
    DROP_DOWN = 'DROP_DOWN',
    LINEAR_SCALE = 'LINEAR_SCALE',
    RATING = 'RATING',
}

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

export const questionTypesMap = {
    [QUESTION_TYPE.TEXT]: { label: 'Short Answer', icon: 'short_text' },
    [QUESTION_TYPE.PARAGRAPH]: { label: 'Paragraph', icon: 'notes' },
    [QUESTION_TYPE.DATE]: { label: 'Date', icon: 'calendar_today' },
    [QUESTION_TYPE.TIME]: { label: 'Time', icon: 'schedule' },
    [QUESTION_TYPE.CHOICE]: { label: 'Multiple Choice', icon: 'check_box' },
    [QUESTION_TYPE.RADIO]: {
        label: 'Single Choice',
        icon: 'radio_button_checked',
    },
    [QUESTION_TYPE.DROP_DOWN]: {
        label: 'Dropdown',
        icon: 'arrow_drop_down_circle',
    },
    [QUESTION_TYPE.LINEAR_SCALE]: {
        label: 'Linear Scale',
        icon: 'linear_scale',
    },
    [QUESTION_TYPE.RATING]: { label: 'Rating', icon: 'star' },
} as const;

interface InputFieldProps {
    id: string;
    initialType?: QuestionType;
    index?: number;
    isOverlay?: boolean;
}

export default function InputField({
    id,
    initialType = QUESTION_TYPE.TEXT,
    index = 0,
    isOverlay = false,
}: InputFieldProps) {
    const [type, setType] = useState<QuestionType>(initialType);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentOption = questionTypesMap[type];

    // Only register as a sortable node for the real (non-overlay) instance
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
        function updateMounted() {
            setMounted(true);
        }
        updateMounted();
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
            id={`question-${index}`}
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className="group bg-theme-form-container before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border relative flex w-full flex-col rounded-xl p-3"
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
                                    const isSelected = key === type;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                setType(key);
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
            <div className="border-theme-form-container-border/70 mt-2 grid grid-rows-[0fr] border-t opacity-0 transition-all duration-300 ease-in-out group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                <div className="overflow-hidden">
                    <div className="flex h-12 w-full items-center justify-end">
                        <div className="border-theme-form-container-border/70 grid grid-cols-[40px_40px] border-r pl-3">
                            <button
                                tabIndex={-1}
                                className="hover:bg-theme-form-container-hover focus-visible:bg-theme-form-container-hover flex h-10 w-10 items-center justify-center rounded-md group-focus-within:[tab-index:0] group-hover:[tab-index:0]"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    content_copy
                                </span>
                            </button>
                            <button
                                tabIndex={-1}
                                className="hover:bg-theme-form-container-hover focus-visible:bg-theme-form-container-hover flex h-10 w-10 items-center justify-center rounded-md"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    delete
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <p className="text-sm">Required</p>
                            <Toggle />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
