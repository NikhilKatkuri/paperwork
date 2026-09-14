'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormCreate } from '../../providers/FormCreate';

function FloatingTootbar() {
    const { handleAddQuestion, handleAddSection: addNewSection } =
        useFormCreate();

    const [topPosition, setTopPosition] = useState<number | null>(null);
    const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);

    const positionRef = useRef<number | null>(null);
    const activeElementRef = useRef<HTMLElement | null>(null);

    function cleanNearestId(nearestId: string | null): number {
        if (!nearestId) return 0;

        const match = nearestId.match(/section-(\d+)/);
        return match ? Number(match[1]) : 0;
    }

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            const selectedElement = target.closest(
                '.floating-toolbar-selector'
            ) as HTMLElement | null;

            if (selectedElement) {
                activeElementRef.current = selectedElement;

                const rect = selectedElement.getBoundingClientRect();
                const newTop = rect.top + window.scrollY + 20;

                positionRef.current = newTop;
                setTopPosition(newTop);
                setActiveSectionIdx(cleanNearestId(selectedElement.id));

                return;
            }

            const isClickInsideToolbarArea = target.closest(
                '.floating-toolbar-area'
            );

            if (!isClickInsideToolbarArea) {
                activeElementRef.current = null;
                positionRef.current = null;
                setTopPosition(null);
                setActiveSectionIdx(0);
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
                    onClick={() => handleAddQuestion(activeSectionIdx)}
                    className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent"
                >
                    <span className="material-symbols-outlined text-theme-form-container-icon">
                        add
                    </span>
                </button>

                <button
                    onClick={addNewSection}
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
