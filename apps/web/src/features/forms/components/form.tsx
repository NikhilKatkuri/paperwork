'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';

import FloatingTootbar from './create/FloatingTootbar';
import Section from './create/section';
import { useForm } from '../providers/form';

function FormLayout() {
    const { sectionOrder, reorderSections } = useForm();

    function handleSectionDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = sectionOrder.indexOf(String(active.id));
        const newIndex = sectionOrder.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            reorderSections(newOrder);
        }
    }

    return (
        <div className="bg-theme-form-surface relative mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 md:max-w-[90%] lg:max-w-3xl">
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
            >
                <SortableContext
                    items={sectionOrder}
                    strategy={verticalListSortingStrategy}
                >
                    {sectionOrder.map((sectionKey) => (
                        <Section key={sectionKey} sectionId={sectionKey} />
                    ))}
                </SortableContext>
            </DndContext>

            <div className="py-36" />

            <FloatingTootbar />
        </div>
    );
}

export default FormLayout;
