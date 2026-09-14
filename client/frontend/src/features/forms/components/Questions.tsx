'use client';

import { useFormCreate } from '../providers/FormCreate';
import Section from './create/section';

function QuestionsLayout() {
    const { handleAddQuestion, sections, handleAddSection:addNewSection  } = useFormCreate();

    return (
        <div className="relative mx-auto flex h-full w-full scrollbar-none flex-col items-center gap-4 overflow-y-scroll py-3 max-md:px-3 md:max-w-[90%] lg:max-w-3xl">
            {sections.size > 0 &&
                Array.from(sections.keys()).map((sectionIdx) => (
                    <Section key={sectionIdx} sectionIdx={sectionIdx} />
                ))}
            <div className="bg-theme-form-container fixed bottom-6 h-auto w-12 self-end overflow-hidden rounded-lg shadow md:bottom-24 md:translate-x-[120%]">
                <div className="grid h-full w-full grid-cols-1 grid-rows-2">
                    <button
                        onClick={() => handleAddQuestion(0)}
                        className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent"
                    >
                        <span className="material-symbols-outlined text-theme-form-container-icon">
                            add
                        </span>
                    </button>
                    <button 
                        onClick={addNewSection}
                        className="hover:bg-theme-form-container-active/50 aspect-square w-12 cursor-pointer bg-transparent">
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
