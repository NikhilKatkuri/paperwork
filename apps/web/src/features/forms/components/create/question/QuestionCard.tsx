'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
    QuestionTypeEnum,
    type MatrixConfig,
    type QuestionDoc,
    type QuestionType,
    type RatingConfig,
    type ScaleConfig,
} from '@paperwork/types';
import { useForm } from '@/features/forms/providers/form';
import { generateObjectId } from '@/features/forms/utils';
import { cn } from '@/utils/cn';

import RichTextInput from '../../common/RichTextInput';
import QuestionActions from './QuestionActions';
import QuestionTypeRenderer from '../question-types/QuestionTypeRenderer';
import { questionTypesMap } from '../../common/types';

interface QuestionCardProps {
    id: string;
    sectionId: string;
    isOverlay?: boolean;
}

const createOverlayFallback = (type: QuestionType): QuestionDoc => ({
    id: generateObjectId(),
    index: 0,
    type,
    question: 'Untitled Question',
    isRequired: false,
    slug: '',
    v: 0,
    updatedAt: '',
    createdAt: '',
    sectionId: '',
    formId: '',
});

/**
 * Fresh configs for a newly-selected type, so the question is submittable
 * immediately — the editors only persist configs once the user touches them,
 * and a config-less question used to fail sync validation on the next
 * autosave. Stale configs from the previous type are dropped at the call
 * site (set to `undefined`, which serializes away).
 */
function defaultsForType(type: QuestionType): Partial<QuestionDoc> {
    switch (type) {
        case QuestionTypeEnum.CHOICE:
        case QuestionTypeEnum.RADIO:
        case QuestionTypeEnum.DROP_DOWN:
            return {
                optionsConfig: {
                    options: [{ index: 0, label: 'Option 1' }],
                },
            };
        case QuestionTypeEnum.RATING: {
            const ratingConfig: RatingConfig = {
                icon: 'STAR',
                scale: 5,
            };
            return { ratingConfig };
        }
        case QuestionTypeEnum.LINEAR_SCALE: {
            const scaleConfig: ScaleConfig = {
                lowerBound: 1,
                upperBound: 5,
            };
            return { scaleConfig };
        }
        case QuestionTypeEnum.MATRIX: {
            const matrixConfig: MatrixConfig = {
                rows: [{ id: 'row-1', label: 'Row 1' }],
                columns: [
                    { id: 'col-1', label: 'Column 1' },
                    { id: 'col-2', label: 'Column 2' },
                ],
            };
            return { matrixConfig };
        }
        default:
            return {};
    }
}

export default function QuestionCard({
    id,
    sectionId,
    isOverlay = false,
}: Readonly<QuestionCardProps>) {
    const { updateQuestion, getQuestionById } = useForm();

    const [overlayFallback] = useState(() =>
        createOverlayFallback(QuestionTypeEnum.TEXT)
    );

    const question = getQuestionById(id);
    const config = question ?? overlayFallback;
    // Never trust the stored type blindly: poisoned/legacy cache records
    // without a known type used to crash here (`currentOption.icon`).
    const safeType = (
        Object.values(QuestionTypeEnum) as string[]
    ).includes(config.type as string)
        ? (config.type as QuestionType)
        : QuestionTypeEnum.TEXT;
    const currentOption = questionTypesMap[safeType];

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuStyle, setMenuStyle] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: isOverlay });

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

            const insideWrapper = wrapperRef.current?.contains(target);
            const insideMenu = menuRef.current?.contains(target);

            if (!insideWrapper && !insideMenu) {
                setIsDropdownOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDropdownOpen]);

    function patch<K extends keyof QuestionDoc>(key: K, value: QuestionDoc[K]) {
        updateQuestion(id, (previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function mergePatch(changes: Partial<QuestionDoc>) {
        updateQuestion(id, (previous) => ({
            ...previous,
            ...changes,
        }));
    }

    return (
        <div
            id={`section-${sectionId}:question-${id}`}
            data-section-id={sectionId}
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className={cn(
                'floating-toolbar-selector group/question-body bg-theme-form-container relative flex w-full flex-col rounded-xl p-3',
                'before:bg-theme-form-container-border/0 focus-within:before:bg-theme-form-container-border',
                'before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-2 before:rounded-l-xl before:transition-all',
                'hover:before:bg-theme-form-container-border'
            )}
        >
            <div className="flex items-center justify-center">
                <button
                    type="button"
                    aria-label="Drag question"
                    {...(isOverlay ? {} : attributes)}
                    {...(isOverlay ? {} : listeners)}
                    className="cursor-grab active:cursor-grabbing"
                >
                    <span className="material-symbols-outlined rotate-90 text-gray-400">
                        drag_indicator
                    </span>
                </button>
            </div>

            <div className="relative flex items-start gap-3 max-md:flex-wrap">
                <div className="min-w-0 flex-1">
                    <RichTextInput
                        placeholder="Untitled Question"
                        className="h-8"
                        value={config.question}
                        onChange={(value) => patch('question', value)}
                    />
                </div>

                <div
                    ref={wrapperRef}
                    className="relative w-full max-md:mt-2 md:w-54"
                >
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() =>
                            setIsDropdownOpen((previous) => !previous)
                        }
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                        className="border-theme-form-container-border active:bg-theme-form-container-hover flex h-12 w-full items-center justify-between rounded-md border p-2 text-sm"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">
                                {currentOption.icon}
                            </span>
                            <span className="truncate">
                                {currentOption.label}
                            </span>
                        </span>

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
                                aria-label="Question type"
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
                                ).map((type) => {
                                    const option = questionTypesMap[type];
                                    const selected = type === safeType;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => {
                                                updateQuestion(id, (prev) => ({
                                                    ...prev,
                                                    type,
                                                    // Drop configs from the
                                                    // previous type, then
                                                    // attach fresh ones —
                                                    // stale configs fail
                                                    // server validation.
                                                    optionsConfig: undefined,
                                                    ratingConfig: undefined,
                                                    scaleConfig: undefined,
                                                    matrixConfig: undefined,
                                                    ...defaultsForType(type),
                                                }));
                                                setIsDropdownOpen(false);
                                            }}
                                            className={cn(
                                                'hover:bg-theme-form-container-hover flex h-10 w-full items-center gap-2 rounded-md p-2 text-left text-sm',
                                                selected &&
                                                    'bg-theme-form-container-hover font-medium'
                                            )}
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
                        onChange={(value) => patch('helpText', value)}
                    />
                </div>
            )}

            {config.placeholder !== undefined && (
                <div className="flex-1">
                    <RichTextInput
                        placeholder="Placeholder text (optional)"
                        className="h-8"
                        value={config.placeholder ?? ''}
                        onChange={(value) => patch('placeholder', value)}
                    />
                </div>
            )}

            <QuestionTypeRenderer
                id={id}
                type={safeType}
                update={(changes) =>
                    updateQuestion(id, (prev) => ({ ...prev, ...changes }))
                }
            />

            <QuestionActions
                id={id}
                isRequired={config.isRequired ?? false}
                showMoreOptions={showMoreOptions}
                setShowMoreOptions={setShowMoreOptions}
                updateConfig={mergePatch}
                helpText={config.helpText}
                placeholder={config.placeholder}
                sectionIdx={0}
            />
        </div>
    );
}
