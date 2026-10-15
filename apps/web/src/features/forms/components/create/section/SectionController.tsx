'use client';

import { useFormCreate } from '@/features/forms/providers/FormCreate';
import { SectionAction } from '@/features/forms/types/section.type';
import { useEffect, useRef, useState } from 'react';

interface SectionControllerProps {
    size: number;
    idx: number;
}

function SectionController({ size, idx }: Readonly<SectionControllerProps>) {
    const { updateSectionData, sections } = useFormCreate();
    const [showModal, setShowModal] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
 
    const currentSection = sections.get(idx);
    
    const sectionAction: SectionAction = currentSection?.defaultAction ?? {
        actionType: 'NEXT_SECTION',
    };

    const handleActionChange = (newAction: SectionAction) => {
        updateSectionData(idx, {
            defaultAction: newAction,
        });
        setShowModal(false);
    };

    function getLabelForAction(action: SectionAction) {
        switch (action.actionType) {
            case 'NEXT_SECTION':
                return 'Continue to Next Section';
            case 'GO_TO_SECTION':
                return `Go to Section ${action.sectionId + 1}`;
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
    
    if (size <= 1 || idx >= size - 1) return null;

    return (
        <div className="relative py-2 text-sm" ref={containerRef}>
            <div className="flex items-center gap-3">
                <p>After Section {idx + 1}</p>

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
                                        actionType: 'NEXT_SECTION',
                                    })
                                }
                            >
                                Continue to Next Section
                            </button>

                            {Array.from({ length: size }, (_, i) => i).map(
                                (sectionId) => {
                                    if (idx + 1 === sectionId) return null;
                                    return (
                                        <button
                                            key={sectionId}
                                            type="button"
                                            className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                            onClick={() =>
                                                handleActionChange({
                                                    actionType: 'GO_TO_SECTION',
                                                    sectionId:
                                                        sectionId.toString(),
                                                })
                                            }
                                        >
                                            Go to Section {sectionId + 1}
                                        </button>
                                    );
                                }
                            )}

                            <button
                                type="button"
                                className="hover:bg-theme-form-container-active/20 h-12 w-full px-4 text-start"
                                onClick={() =>
                                    handleActionChange({
                                        actionType: 'SUBMIT_FORM',
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
