'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from '../../providers/form';

function FloatingTootbar() {
    const { addQuestion, addSection } = useForm();

    const [topPosition, setTopPosition] = useState<number | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const positionRef = useRef<number | null>(null);
    const activeElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            const selectedElement = target.closest(
                '.floating-toolbar-selector'
            ) as HTMLElement | null;

            if (selectedElement) {
                // The element `id` is a compound DOM id
                // (`section-<id>` / `section-<id>:question-<id>`) — never a
                // section id. Resolve the real one via `data-section-id`.
                const holder = selectedElement.closest(
                    '[data-section-id]'
                ) as HTMLElement | null;
                const sectionId = holder?.dataset.sectionId;

                if (!sectionId) {
                    activeElementRef.current = null;
                    positionRef.current = null;
                    setTopPosition(null);
                    setActiveSectionId(null);
                    return;
                }

                activeElementRef.current = selectedElement;

                const rect = selectedElement.getBoundingClientRect();
                const newTop = rect.top + window.scrollY + 20;

                positionRef.current = newTop;
                setTopPosition(newTop);
                setActiveSectionId(sectionId);

                return;
            }

            const isClickInsideToolbarArea = target.closest(
                '.floating-toolbar-area'
            );

            if (!isClickInsideToolbarArea) {
                activeElementRef.current = null;
                positionRef.current = null;
                setTopPosition(null);
                setActiveSectionId(null);
            }
        }

        window.addEventListener('click', handleClick);

        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        let raf: number;

        const updateToolbar = () => {
            const element = activeElementRef.current;

            if (element) {
                const rect = element.getBoundingClientRect();
                const newTop = rect.top + window.scrollY + 20;

                if (newTop !== positionRef.current) {
                    positionRef.current = newTop;
                    setTopPosition(newTop);
                }
            }

            raf = requestAnimationFrame(updateToolbar);
        };

        raf = requestAnimationFrame(updateToolbar);

        return () => cancelAnimationFrame(raf);
    }, []);

    if (topPosition === null) return null;

    return (
        <div
            className="floating-toolbar-area bg-theme-form-container fixed z-50 h-auto w-12 self-end overflow-hidden rounded-lg shadow md:translate-x-[120%]"
            style={{ top: `${topPosition}px` }}
        >
            <div className="grid h-full w-full grid-cols-1 grid-rows-2">
                <button
                    onClick={() =>
                        activeSectionId && addQuestion(activeSectionId)
                    }
                    className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent"
                >
                    <span className="material-symbols-outlined text-theme-form-container-icon">
                        add
                    </span>
                </button>

                <button
                    onClick={addSection}
                    className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent"
                >
                    <span className="material-symbols-outlined text-theme-form-container-icon">
                        view_stream
                    </span>
                </button>
            </div>
        </div>
    );
}

export default FloatingTootbar;
