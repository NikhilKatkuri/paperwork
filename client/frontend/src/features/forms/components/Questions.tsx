'use client';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import InputFeild from './Question-builder/QuestionFeild';
import MetaInputFeilds from './Question-builder/MetaInputFields';
import { useFormCreate } from '../providers/FormCreate';

function QuestionsLayout() {
    const {
        meta,
        handleMetaChange,
        handleAddQuestion,
        questions,
        setQuestions,
    } = useFormCreate();

    const [activeId, setActiveId] = useState<string | null>(null);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((prev) => {
                const entries = Array.from(prev.entries());
                const activeIndex = entries.findIndex(
                    ([id]) => id === active.id
                );
                const overIndex = entries.findIndex(([id]) => id === over.id);

                if (activeIndex === -1 || overIndex === -1) return prev;

                return new Map(arrayMove(entries, activeIndex, overIndex));
            });
        }

        setActiveId(null);
    }

    const orderedIds = Array.from(questions.keys());
    const activeIndex = activeId ? orderedIds.indexOf(activeId) : -1;

    return (
        <div className="relative mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 lg:max-w-3xl">
            <MetaInputFeilds meta={meta} onChange={handleMetaChange} />
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                    {orderedIds.map((id, index) => (
                        <InputFeild key={id} id={id} index={index} />
                    ))}
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <InputFeild
                            id={activeId}
                            index={activeIndex}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
            <div className="bg-theme-form-container fixed bottom-6 h-auto w-12 self-end overflow-hidden rounded-lg shadow md:bottom-24 md:translate-x-[120%]">
                <div className="grid h-full w-full grid-cols-1 grid-rows-2">
                    <button
                        onClick={handleAddQuestion}
                        className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent"
                    >
                        <span className="material-symbols-outlined text-theme-form-container-icon">
                            add
                        </span>
                    </button>
                    <button className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent">
                        <span className="material-symbols-outlined text-theme-form-container-icon">
                            view_stream
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuestionsLayout;