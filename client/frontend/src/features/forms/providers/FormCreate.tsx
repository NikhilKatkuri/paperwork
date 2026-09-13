'use client';

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { generateId } from '../utils';
import { QuestionCore } from '../types';
import { QUESTION_TYPE } from '../components/Question-builder/types';

type meta = { title: string; description: string };

export interface FormCreateContextValue {
    meta: meta;
    handleMetaChange: ({
        key,
        value,
    }: {
        key: keyof meta;
        value: string;
    }) => void;

    handleAddQuestion: () => void;
    duplicateQuestion: (id: string) => void;
    deleteQuestion: (id: string) => void;
    questions: Map<string, QuestionCore>;
    setQuestions: React.Dispatch<
        React.SetStateAction<Map<string, QuestionCore>>
    >;
    updateQuestion: (
        id: string,
        updatedQuestion: Partial<QuestionCore>
    ) => void;
    handleQuestionChange: <K extends keyof QuestionCore>(
        id: string,
        key: K,
        value: QuestionCore[K]
    ) => void;
}

const FormCreateContext = createContext<FormCreateContextValue | undefined>(
    undefined
);

export function FormCreateProvider({ children }: { children: ReactNode }) {
    const [meta, setMeta] = useState({
        title: 'Untitled Form',
        description: 'Form description',
    });

    function handleMetaChange({
        key,
        value,
    }: {
        key: keyof meta;
        value: string;
    }) {
        setMeta((data) => ({ ...data, [key]: value }));
    }

    const [questions, setQuestions] = useState<Map<string, QuestionCore>>(
        () => {
            const id = generateId();
            return new Map([
                [
                    id,
                    {
                        index: 1,
                        type: QUESTION_TYPE.TEXT,
                        question: 'Untitled Question',
                    },
                ],
            ]);
        }
    );

    const handleAddQuestionRef = useRef(false);

    function handleAddQuestion() {
        if (handleAddQuestionRef.current) return;
        handleAddQuestionRef.current = true;

        const newId = generateId();
        setQuestions((prev) => {
            const next = new Map(prev);
            next.set(newId, {
                index: prev.size + 1,
                type: QUESTION_TYPE.TEXT,
                question: 'Untitled Question',
            });
            return next;
        });

        setTimeout(() => {
            handleAddQuestionRef.current = false;
        }, 300);
    }

    function handleQuestionChange<K extends keyof QuestionCore>(
        id: string,
        key: K,
        value: QuestionCore[K]
    ) {
        setQuestions((prev) => {
            const question = prev.get(id);
            if (!question) return prev;

            const next = new Map(prev);
            next.set(id, { ...question, [key]: value });
            return next;
        });
    }

    function duplicateQuestion(id: string) {
        const questionToDuplicate = questions.get(id);
        if (!questionToDuplicate) return;

        const newId = generateId();
        setQuestions((prev) => {
            const next = new Map(prev);
            next.set(newId, {
                ...questionToDuplicate,
                index: prev.size + 1,
            });
            return next;
        });
    }

    function deleteQuestion(id: string) {
        setQuestions((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }

    const updateQuestion = useCallback(
        (id: string, patch: Partial<QuestionCore>) => {
            setQuestions((prev) => {
                const question = prev.get(id);
                if (!question) return prev;
                const next = new Map(prev);
                next.set(id, { ...question, ...patch });
                return next;
            });
        },
        []
    );
    return (
        <FormCreateContext.Provider
            value={{
                handleMetaChange,
                meta,
                handleAddQuestion,
                duplicateQuestion,
                deleteQuestion,
                questions,
                setQuestions,
                updateQuestion,
                handleQuestionChange,
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
