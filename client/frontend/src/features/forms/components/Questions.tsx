'use client';
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import InputFeild from './Question-ui/InputFeild';
import MetaInputFeilds from './Question-ui/MetaInputFields';

function QuestionsLayout() {
    const [items, setItems] = useState(['1', '2', '3', '4', '5']);
    const [activeId, setActiveId] = useState<string | null>(null);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.indexOf(active.id as string);
                const newIndex = prev.indexOf(over.id as string);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }

        setActiveId(null);
    }

    const activeIndex = activeId ? items.indexOf(activeId) : -1;

    return (
        <div className="mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 lg:max-w-3xl">
            <MetaInputFeilds />
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((id, index) => (
                        <InputFeild key={id} id={id} index={index} />
                    ))}
                </SortableContext>
                <DragOverlay>
                    {activeId ? <InputFeild id={activeId} index={activeIndex} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export default QuestionsLayout;