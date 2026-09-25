'use client';

import { useState } from 'react';
import MetaInputFeilds from './MetaInputFields';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useFormCreate } from '@/features/forms/providers/FormCreate';
import InputField from '../question/QuestionFeild';
import SectionController from './SectionController';

interface SectionProps {
    sectionIdx: number;
}

function Section({ sectionIdx }: Readonly<SectionProps>) {
    const { questions, reorderQuestions, sections } = useFormCreate();

    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(
        null
    );

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sectionIdx,
    });

    const sectionStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    function handleQuestionDragStart(event: DragStartEvent) {
        setActiveQuestionId(event.active.id as number);
    }

    function handleQuestionDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            reorderQuestions(
                sectionIdx,
                active.id as number,
                over.id as number
            );
        }

        setActiveQuestionId(null);
    }

    const filteredQuestions = Array.from(questions.entries())
        .filter(([, question]) => question.sectionIdx === sectionIdx)
        .sort((a, b) => a[1].index - b[1].index);

    const orderedQuestionIds = filteredQuestions.map(([id]) => id);

    const activeQuestionIndex =
        activeQuestionId !== null
            ? orderedQuestionIds.indexOf(activeQuestionId)
            : -1;

    return (
        <section
            ref={setNodeRef}
            style={sectionStyle}
            id={`section-${sectionIdx}`}
            className="floating-toolbar-area flex w-full flex-col gap-4 rounded-xl"
        >
            <div className="w-full">
                {sections.size > 1 && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="bg-theme-form-container-active flex h-12 w-full cursor-grab items-center justify-between rounded-t-xl px-4 select-none active:cursor-grabbing sm:w-64"
                    >
                        <p className="font-medium text-white">
                            Section {sectionIdx + 1} of {sections.size}
                        </p>

                        <span className="material-symbols-outlined text-white">
                            drag_indicator
                        </span>
                    </div>
                )}

                <MetaInputFeilds sectionIdx={sectionIdx} />
            </div>

            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleQuestionDragStart}
                onDragEnd={handleQuestionDragEnd}
            >
                <SortableContext
                    items={orderedQuestionIds}
                    strategy={verticalListSortingStrategy}
                >
                    {orderedQuestionIds.map((id, index) => (
                        <InputField
                            key={id}
                            id={id}
                            index={index}
                            sectionIdx={sectionIdx}
                        />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeQuestionId !== null && (
                        <InputField
                            id={activeQuestionId}
                            index={activeQuestionIndex}
                            sectionIdx={sectionIdx}
                            isOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>
            <SectionController size={sections.size} idx={sectionIdx} />
        </section>
    );
}

export default Section;
