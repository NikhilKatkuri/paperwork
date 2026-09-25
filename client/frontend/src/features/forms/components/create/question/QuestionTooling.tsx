'use client';

import { useFormCreate } from '@/features/forms/providers/FormCreate';
import QuestionCore from '@/features/forms/types/question.type';
import Toggle from '../../common/Toggle';

interface QuestionToolingProps {
    isRequired: boolean;
    helpText: string | undefined;
    showMoreOptions: boolean;
    setShowMoreOptions: (value: boolean) => void;
    updateConfig: (patch: Partial<QuestionCore>) => void;
    id: number;
    sectionIdx: number;
}

function QuestionTooling({
    isRequired,
    helpText,
    showMoreOptions,
    setShowMoreOptions,
    updateConfig,
    id,
}: Readonly<QuestionToolingProps>) {
    const { duplicateQuestion, deleteQuestion } = useFormCreate();

    return (
        <div className="border-theme-form-container-border/70 mt-2 grid grid-rows-[0fr] border-t opacity-0 transition-all duration-300 ease-in-out group-focus-within/question-body:grid-rows-[1fr] group-focus-within/question-body:opacity-100 group-hover/question-body:grid-rows-[1fr] group-hover/question-body:opacity-100">
            <div className="overflow-hidden">
                <div className="flex h-12 w-full items-center justify-end">
                    <div className="border-theme-form-container-border/70 grid grid-cols-[40px_40px] border-r pl-3">
                        <button
                            onClick={() => duplicateQuestion(id)}
                            className="hover:bg-theme-form-container-hover focus-visible:bg-theme-form-container-hover flex h-10 w-10 items-center justify-center rounded-md group-focus-within/question-body:[tab-index:0] group-hover/question-body:[tab-index:0]"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                content_copy
                            </span>
                        </button>
                        <button
                            onClick={() => deleteQuestion(id)}
                            className="hover:bg-theme-form-container-hover focus-visible:bg-theme-form-container-hover flex h-10 w-10 items-center justify-center rounded-md"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                delete
                            </span>
                        </button>
                    </div>
                    <div className="border-theme-form-container-border/70 flex h-10 items-center gap-2 border-r px-3">
                        <p className="text-sm">Required</p>
                        <Toggle
                            onChange={(value) =>
                                updateConfig({ isRequired: value })
                            }
                            checked={isRequired}
                            defaultChecked={false}
                        />
                    </div>
                    <button
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                        className="hover:bg-theme-form-container-hover relative mx-3 flex aspect-square h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-transparent active:scale-95"
                    >
                        <span className="material-symbols-outlined">
                            more_vert
                        </span>
                    </button>
                    {showMoreOptions && (
                        <div className="bg-theme-form-container absolute top-full right-0 z-10 mt-1 h-auto w-64 overflow-hidden rounded-lg shadow-lg">
                            <div className="grid grid-cols-1">
                                <p className="text-theme-form-on-container p-3 text-xs">
                                    Show
                                </p>
                                <button
                                    onClick={() =>
                                        updateConfig({
                                            helpText:
                                                helpText === undefined ||
                                                helpText === ''
                                                    ? ''
                                                    : undefined,
                                        })
                                    }
                                    className="text-theme-form-on-container hover:bg-theme-form-container-border/40 h-10 w-full bg-transparent px-3 pl-6 text-left text-sm"
                                >
                                    help text
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuestionTooling;
