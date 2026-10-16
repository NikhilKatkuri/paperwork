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
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import SectionController from './SectionController';
import { useForm } from '@/features/forms/providers/form';
import QuestionCard from '../question/QuestionCard';

interface SectionProps {
    sectionId: string;
}

function Section({ sectionId }: Readonly<SectionProps>) {
    const { getQuestionsBySectionId, sectionsMap, reorderQuestions } =
        useForm();
 
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
        null
    );
    
    const sectionQuestions = getQuestionsBySectionId(sectionId);
    const questionIds = sectionQuestions.map((q) => q.id);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sectionId,
    });

    const sectionStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    function handleQuestionDragStart(event: DragStartEvent) {
        setActiveQuestionId(event.active.id as string);
    }

    function handleQuestionDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveQuestionId(null);

        if (!over || active.id === over.id) return;
 
        const oldIndex = questionIds.indexOf(String(active.id));
        const newIndex = questionIds.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
            const newSectionQuestions = arrayMove(sectionQuestions, oldIndex, newIndex);
            reorderQuestions(newSectionQuestions, sectionId);
        }
    }

    return (
        <section
            ref={setNodeRef}
            style={sectionStyle}
            id={`section-${sectionId}`}
            className="floating-toolbar-area flex w-full flex-col gap-4 rounded-xl"
        >
            <div className="w-full">
                {sectionsMap.size > 1 && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="bg-theme-form-container-active flex h-12 w-full cursor-grab items-center justify-between rounded-t-xl px-4 select-none active:cursor-grabbing sm:w-64"
                    >
                        <p className="font-medium text-white">
                            Section {sectionsMap.get(sectionId)!.index + 1} of{' '}
                            {sectionsMap.size}
                        </p>

                        <span className="material-symbols-outlined text-white">
                            drag_indicator
                        </span>
                    </div>
                )}

                <MetaInputFeilds
                    sectionId={sectionId}
                    hasMultipleSections={sectionsMap.size > 1}
                />
            </div>

            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleQuestionDragStart}
                onDragEnd={handleQuestionDragEnd}
            >
                <SortableContext
                    items={questionIds}
                    strategy={verticalListSortingStrategy}
                >
                    {sectionQuestions.map((q) => (
                        <QuestionCard
                            key={q.id}
                            sectionId={q.sectionId}
                            id={q.id}
                        />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeQuestionId !== null && (
                        <QuestionCard
                            id={activeQuestionId}
                            sectionId={sectionId}
                            isOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>
            <SectionController size={sectionsMap.size} id={sectionId} index={0} />
        </section>
    );
}

export default Section;