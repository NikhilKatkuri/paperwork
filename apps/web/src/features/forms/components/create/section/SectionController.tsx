'use client';
  
import { useForm } from '@/features/forms/providers/form';
import { SectionAction } from '@paperwork/types';
import { useEffect, useRef, useState } from 'react';

interface SectionControllerProps {
    size: number; 
    id: string;
    index: number;
}

function SectionController({ size, id, index }: Readonly<SectionControllerProps>) {
    const { sectionsMap, updateSection, sectionOrder } = useForm();

    const [showModal, setShowModal] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentSection = sectionsMap.get(id);

    const sectionAction: SectionAction = currentSection?.defaultAction ?? {
        type: 'NEXT_SECTION',
    } satisfies SectionAction;

    const handleActionChange = (newAction: SectionAction) => {
        updateSection(id, (prev) => ({
            ...prev,
            defaultAction: newAction,
        }));
        setShowModal(false);
    };

    function getLabelForAction(action: SectionAction) {
        switch (action.type) {
            case 'NEXT_SECTION':
                return 'Continue to Next Section';
            case 'GO_TO_SECTION': {
                const targetSec = sectionsMap.get(action.targetSectionId!);
                return targetSec ? `Go to Section ${targetSec.index + 1}` : 'Go to Section';
            }
            case 'SUBMIT_FORM':
                return 'Submit Form';
            default:
                return 'Continue to Next Section';
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowModal(false);
            }
        }

        if (showModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModal]);

    if (size <= 1 || index >= size - 1) return null;

    return (
        <div className="relative py-2 text-sm" ref={containerRef}>
            <div className="flex items-center gap-3">
                <p>After Section {index + 1}</p>

                <div className="relative inline-block w-full md:max-w-64">
                    <button
                        type="button"
                        aria-expanded={showModal}
                        onClick={() => setShowModal((prev) => !prev)}
                        className="active:bg-theme-form-container-active/20 grid h-12 w-full cursor-pointer grid-cols-[1fr_24px] items-center rounded-md bg-transparent px-2 text-left"
                    >
                        <span>{getLabelForAction(sectionAction)}</span>
                        <span className="material-symbols-outlined pt-1">
                            stat_minus_1
                        </span>
                    </button>

                    {showModal && (
                        <div className="bg-theme-form-container-hover section_controller_modal absolute top-0 left-0 z-50 mt-1 flex w-64 flex-col rounded-xl py-2 shadow-lg">
                            <button
                                type="button"
                                className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                onClick={() =>
                                    handleActionChange({
                                        type: 'NEXT_SECTION',
                                    })
                                }
                            >
                                Continue to Next Section
                            </button>
 
                            {sectionOrder.map((secId) => {
                                const section = sectionsMap.get(secId);
                                if (!section) return null;
 
                                if (section.index === index + 1) return null;

                                return (
                                    <button
                                        key={secId}
                                        type="button"
                                        className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                        onClick={() =>
                                            handleActionChange({
                                                type: 'GO_TO_SECTION',
                                                targetSectionId: secId,
                                            })
                                        }
                                    >
                                        Go to Section {section.index + 1}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                onClick={() =>
                                    handleActionChange({
                                        type: 'SUBMIT_FORM',
                                    })
                                }
                            >
                                Submit Form
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SectionController;