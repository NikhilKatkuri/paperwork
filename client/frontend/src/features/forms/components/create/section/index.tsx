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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useFormCreate } from '@/features/forms/providers/FormCreate';
import InputField from '../question/QuestionFeild';

interface SectionProps {
    sectionIdx: number;
}

function Section({ sectionIdx }: SectionProps) {
    const { questions, reorderQuestions, sections} = useFormCreate();
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    function handleDragStart(event: DragStartEvent) {
        setActiveIdx(event.active.id as number);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            reorderQuestions(
                sectionIdx,
                active.id as number,
                over.id as number
            );
        }

        setActiveIdx(null);
    }

    const filteredQuestions = Array.from(questions.entries()).filter(
        ([, question]) => question.sectionIdx === sectionIdx
    );
    const orderedIds = filteredQuestions.map(([id]) => id);
    const activeIndex = activeIdx !== null ? orderedIds.indexOf(activeIdx) : -1;

    return (
        <section
            id={`section-${sectionIdx}`}
            className="flex w-full flex-col gap-4"
        >
            <div className="w-full">
                {sections.size > 1 && (
                    <div className="bg-theme-form-container-active flex h-12 w-full items-center justify-center rounded-t-xl sm:w-64">
                        <p className="font-medium text-white">
                            Section {sectionIdx + 1} of {sections.size}
                        </p>
                    </div>
                )}
                <MetaInputFeilds sectionIdx={sectionIdx} />
            </div>
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={orderedIds}
                    strategy={verticalListSortingStrategy}
                >
                    {orderedIds.map((id, index) => (
                        <InputField key={id} id={id} index={index} />
                    ))}
                </SortableContext>
                <DragOverlay>
                    {activeIdx !== null && (
                        <InputField
                            id={activeIdx}
                            index={activeIndex}
                            isOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </section>
    );
}

export default Section;
