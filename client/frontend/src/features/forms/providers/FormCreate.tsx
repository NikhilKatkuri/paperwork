'use client';

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    DEFAULT_FORM_CORE,
    DEFAULT_QUESTION_CORE,
    DEFAULT_SECTION_CORE,
} from '../utils/default';

import FormCore from '../types/form.type';
import SectionCore, { defualtSectionCore } from '../types/section.type';
import QuestionCore from '../types/question.type';
import { FormCreateContextValue, QuestionsMap } from '../types';
import { arrayMove } from '@dnd-kit/sortable';

const FormCreateContext = createContext<FormCreateContextValue | undefined>(
    undefined
);

export function FormCreateProvider({ children }: { children: ReactNode }) {
    /**
     * form management
     */

    const [form, setForm] = useState<FormCore>(DEFAULT_FORM_CORE);

    const handleFormChange = useCallback(
        <k extends keyof FormCore>(key: k, value: FormCore[k]) => {
            setForm((prev) =>
                prev[key] === value ? prev : { ...prev, [key]: value }
            );
        },
        []
    );

    /**
     * section management
     */
    const nextSectionIndexRef = useRef(1);

    const [sections, setSections] = useState<defualtSectionCore>(() => {
        return new Map<number, SectionCore>([[0, DEFAULT_SECTION_CORE]]);
    });

    const handleSectionsChange = useCallback(
        <K extends keyof SectionCore>(
            idx: number,
            key: K,
            value: SectionCore[K]
        ) => {
            setSections((prev) => {
                const currSection = prev.get(idx);
                if (!currSection) return prev;

                const next = new Map(prev);
                next.set(idx, { ...currSection, [key]: value });
                return next;
            });
        },
        []
    );

    const handleAddSection = useCallback(() => {
        const key = nextSectionIndexRef.current++;
        setSections((prev) => {
            const next = new Map(prev);
            next.set(key, {
                ...DEFAULT_SECTION_CORE,
                index: key + 1,
            });
            return next;
        });
    }, []);

    const reorderSections = useCallback(
        (activeKey: number, overKey: number) => {
            setSections((prev) => {
                const entries = Array.from(prev.entries()).sort(
                    (a, b) => a[1].index - b[1].index
                );
                const activeIdx = entries.findIndex(([k]) => k === activeKey);
                const overIdx = entries.findIndex(([k]) => k === overKey);
                if (activeIdx === -1 || overIdx === -1) return prev;

                const reordered = arrayMove(entries, activeIdx, overIdx);
                const next = new Map(prev);
                reordered.forEach(([key, section], i) =>
                    next.set(key, { ...section, index: i })
                );
                return next;
            });
        },
        []
    );

    /**
     * question management
     */

    const nextQuestionIndexRef = useRef(1);
    const handleAddQuestionRef = useRef(false);

    const [questions, setQuestions] = useState<QuestionsMap>(() => {
        return new Map([[0, DEFAULT_QUESTION_CORE]]);
    });

    function countInSection(sectionIdx: number, map: QuestionsMap) {
        let count = 0;
        for (const q of map.values()) if (q.sectionIdx === sectionIdx) count++;
        return count;
    }

    function handleAddQuestion(sectionIdx: number) {
        if (handleAddQuestionRef.current) return;
        handleAddQuestionRef.current = true;

        const newKey = nextQuestionIndexRef.current++;
        setQuestions((prev) => {
            const next = new Map(prev);
            next.set(newKey, {
                ...DEFAULT_QUESTION_CORE,
                index: countInSection(sectionIdx, prev),
                sectionIdx,
            });
            return next;
        });

        setTimeout(() => {
            handleAddQuestionRef.current = false;
        }, 300);
    }

    function handleQuestionChange<K extends keyof QuestionCore>(
        idx: number,
        key: K,
        value: QuestionCore[K]
    ) {
        setQuestions((prev) => {
            const source = prev.get(idx);
            if (!source) return prev;

            const next = new Map(prev);
            next.set(idx, { ...source, [key]: value });
            return next;
        });
    }

    function duplicateQuestion(idx: number) {
        const source = questions.get(idx);
        if (!source) return;

        const newKey = nextQuestionIndexRef.current++;

        setQuestions((prev) => {
            const next = new Map(prev);
            next.set(newKey, {
                ...source,
                index: countInSection(source.sectionIdx, prev),
            });
            return next;
        });
    }

    function deleteQuestion(idx: number) {
        setQuestions((prev) => {
            const next = new Map(prev);
            next.delete(idx);
            return next;
        });
    }

    const updateQuestion = useCallback(
        (idx: number, patch: Partial<QuestionCore>) => {
            setQuestions((prev) => {
                const question = prev.get(idx);
                if (!question) return prev;
                const next = new Map(prev);
                next.set(idx, { ...question, ...patch });
                return next;
            });
        },
        []
    );

    const reorderQuestions = useCallback(
        (sectionIdx: number, activeId: number, overId: number) => {
            setQuestions((prev) => {
                const inSection = Array.from(prev.entries()).filter(
                    ([, section]) => section.sectionIdx === sectionIdx
                );
                const activeIndex = inSection.findIndex(
                    ([id]) => id === activeId
                );
                const overIndex = inSection.findIndex(([id]) => id === overId);
                if (activeIndex === -1 || overIndex === -1) return prev;

                const reordered = arrayMove(inSection, activeIndex, overIndex);
                const next = new Map(prev);
                reordered.forEach(([id, question], index) => {
                    next.set(id, { ...question, index });
                });

                return next;
            });
        },
        []
    );

    // delete section and its questions
    const deleteSection = useCallback(
        (idx: number) => {
            setSections((prev) => {
                const next = new Map(prev);
                next.delete(idx);
                return next;
            });

            questions.forEach((question, questionIdx) => {
                if (question.sectionIdx === idx) {
                    deleteQuestion(questionIdx);
                }
            });
        },
        [questions]
    );

    return (
        <FormCreateContext.Provider
            value={{
                form,
                handleFormChange,

                sections,
                setSections,
                handleSectionsChange,
                handleAddSection,

                handleAddQuestion,
                duplicateQuestion,
                deleteQuestion,
                questions,
                setQuestions,
                updateQuestion,
                handleQuestionChange,
                reorderQuestions,
                reorderSections,
                deleteSection,
            }}
        >
            {children}
        </FormCreateContext.Provider>
    );
}

export function useFormCreate() {
    const context = useContext(FormCreateContext);
    if (context === undefined) {
        throw new Error(
            'useFormCreate must be used within a FormCreateProvider'
        );
    }
    return context;
}
