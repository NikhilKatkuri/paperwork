'use client';

import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useFormCreate } from '../providers/FormCreate';
import FloatingTootbar from './create/FloatingTootbar';
import Section from './create/section';

function FormLayout() {
    const { sections, reorderSections} = useFormCreate();
    const orderedSections = Array.from(sections.entries())
        .sort((a, b) => a[1].index - b[1].index)
        .map(([key]) => key);

    function handleSectionDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        reorderSections(active.id as number, over.id as number);
    }


    return (
        <div className="bg-theme-form-surface relative mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 md:max-w-[90%] lg:max-w-3xl">
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
            >
                <SortableContext
                    items={orderedSections}
                    strategy={verticalListSortingStrategy}
                >
                    {orderedSections.map((sectionKey) => (
                        <Section key={sectionKey} sectionIdx={sectionKey} />
                    ))}
                </SortableContext>
            </DndContext>

            <div className="py-36" />

            <FloatingTootbar />
        </div>
    );
}

export default FormLayout;
