'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    DEFAULT_FORM_CORE,
    createDefaultQuestion,
    createDefaultSection,
} from '../utils/default';
import { DEFAULT_FORM_THEME } from '@/lib/formTheme';

import FormCore from '../types/form.type';
import SectionCore, { defualtSectionCore } from '../types/section.type';
import QuestionCore from '../types/question.type';
import { FormCreateContextValue, QuestionsMap } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { FormDB } from '@/lib/db';
import formRepository from '../repositories/formRepository';
import { debounce } from '@/features/common/utils';
import { syncQueueRepository, syncKey } from '../lib/sync-queue.repository';
import { scheduleFlush, flushFormNow } from '../lib/sync-engine';
import { SyncQueueDB } from '../lib/sync-queue.db';
import { generateObjectId } from '../utils';

const FormCreateContext = createContext<FormCreateContextValue | undefined>(
    undefined
);

async function queueChangedFields(oldForm: FormDB, newForm: FormDB) {
    const operations: SyncQueueDB[] = [];

    const compare = (path: string, oldValue: unknown, newValue: unknown) => {
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

        operations.push({
            // Stable key per field: repeated edits replace the queued row
            // instead of appending, so an editing session stays one row per
            // field and flushes as a single grouped request.
            id: syncKey(newForm._id, path),
            formId: newForm._id,
            operation: 'update',
            path,
            value: newValue,
            createdAt: Date.now(),
            synced: false,
        });
    };

    compare('name', oldForm.name, newForm.name);
    compare('theme', oldForm.theme, newForm.theme);
    compare('isPrivate', oldForm.isPrivate, newForm.isPrivate);
    compare('isPublished', oldForm.isPublished, newForm.isPublished);
    compare('allowedDomains', oldForm.allowedDomains, newForm.allowedDomains);
    compare('settings', oldForm.settings, newForm.settings);
    compare('sections', oldForm.sections, newForm.sections);
    compare('questions', oldForm.questions, newForm.questions);

    if (!operations.length) return;

    await syncQueueRepository.bulkUpsert(operations);

    // Debounced, so any number of edits in this session collapse into one push.
    scheduleFlush(newForm._id);
}

export function FormCreateProvider({
    children,
}: Readonly<{ children: ReactNode }>) {
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
        return new Map<number, SectionCore>([[0, createDefaultSection()]]);
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
                ...createDefaultSection(),
                index: key,
            });

            return next;
        });
    }, []);

    const updateSectionData = useCallback(
        (idx: number, PartialSectionCore: Partial<SectionCore>) => {
            setSections((prev) => {
                const currSection = prev.get(idx);
                if (!currSection) return prev;

                const next = new Map(prev);
                next.set(idx, { ...currSection, ...PartialSectionCore });
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
        return new Map([[0, createDefaultQuestion()]]);
    });

    function countInSection(sectionIdx: number, map: QuestionsMap) {
        let count = 0;
        for (const q of map.values()) if (q.sectionIdx === sectionIdx) count++;
        return count;
    }

    const handleAddQuestion = useCallback((sectionIdx: number) => {
        if (handleAddQuestionRef.current) return;
        handleAddQuestionRef.current = true;

        const newKey = nextQuestionIndexRef.current++;
        setQuestions((prev) => {
            const next = new Map(prev);
            next.set(newKey, {
                ...createDefaultQuestion(),
                index: countInSection(sectionIdx, prev),
                sectionIdx,
            });
            return next;
        });

        setTimeout(() => {
            handleAddQuestionRef.current = false;
        }, 300);
    }, []);

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

    const duplicateQuestion = useCallback(
        (idx: number) => {
            const source = questions.get(idx);
            if (!source) return;

            const newKey = nextQuestionIndexRef.current++;

            setQuestions((prev) => {
                const next = new Map(prev);
                next.set(newKey, {
                    ...source,
                    // A duplicate is a distinct document, not a copy of the id.
                    _id: generateObjectId(),
                    index: countInSection(source.sectionIdx, prev),
                });
                return next;
            });
        },
        [questions]
    );

    const deleteQuestion = useCallback((questionId: number) => {
        setQuestions((prev) => {
            const target = prev.get(questionId);
            if (!target) return prev;

            const next = new Map(prev);
            next.delete(questionId);

            const remaining = [...next.entries()]
                .filter(([, q]) => q.sectionIdx === target.sectionIdx)
                .sort((a, b) => a[1].index - b[1].index);

            remaining.forEach(([id, question], index) => {
                next.set(id, {
                    ...question,
                    index,
                });
            });

            return next;
        });
    }, []);

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
                const sectionQuestions = Array.from(prev.entries())
                    .filter(([, q]) => q.sectionIdx === sectionIdx)
                    .sort((a, b) => a[1].index - b[1].index);

                const activeIndex = sectionQuestions.findIndex(
                    ([id]) => id === activeId
                );
                const overIndex = sectionQuestions.findIndex(
                    ([id]) => id === overId
                );

                if (activeIndex === -1 || overIndex === -1) return prev;

                const reordered = arrayMove(
                    sectionQuestions,
                    activeIndex,
                    overIndex
                );

                const next = new Map(prev);

                reordered.forEach(([id, question], index) => {
                    next.set(id, {
                        ...question,
                        index,
                    });
                });

                return next;
            });
        },
        []
    );

    const deleteSection = useCallback((sectionId: number) => {
        setSections((prev) => {
            const entries = [...prev.entries()]
                .filter(([id]) => id !== sectionId)
                .sort((a, b) => a[1].index - b[1].index);

            const next = new Map<number, SectionCore>();

            entries.forEach(([, section], newIndex) => {
                next.set(newIndex, {
                    ...section,
                    index: newIndex,
                });
            });

            nextSectionIndexRef.current = next.size;

            return next;
        });

        setQuestions((prev) => {
            const next = new Map<number, QuestionCore>();

            prev.forEach((question, id) => {
                if (question.sectionIdx === sectionId) return;

                next.set(id, {
                    ...question,
                    sectionIdx:
                        question.sectionIdx > sectionId
                            ? question.sectionIdx - 1
                            : question.sectionIdx,
                });
            });

            const grouped = new Map<number, [number, QuestionCore][]>();

            next.forEach((question, id) => {
                const arr = grouped.get(question.sectionIdx) ?? [];
                arr.push([id, question]);
                grouped.set(question.sectionIdx, arr);
            });

            grouped.forEach((list) => {
                list.sort((a, b) => a[1].index - b[1].index);

                list.forEach(([id, question], order) => {
                    next.set(id, {
                        ...question,
                        index: order,
                    });
                });
            });

            return next;
        });
    }, []);

    const reorderSections = useCallback(
        (activeKey: number, overKey: number) => {
            setSections((prevSections) => {
                const entries = [...prevSections.entries()].sort(
                    (a, b) => a[1].index - b[1].index
                );

                const activeIndex = entries.findIndex(
                    ([id]) => id === activeKey
                );
                const overIndex = entries.findIndex(([id]) => id === overKey);

                if (activeIndex === -1 || overIndex === -1) return prevSections;

                const reordered = arrayMove(entries, activeIndex, overIndex);

                const sectionMap = new Map<number, number>();
                const nextSections = new Map<number, SectionCore>();

                reordered.forEach(([, section], newIndex) => {
                    sectionMap.set(section.index, newIndex);

                    nextSections.set(newIndex, {
                        ...section,
                        index: newIndex,
                    });
                });

                nextSectionIndexRef.current = nextSections.size;

                setQuestions((prevQuestions) => {
                    const nextQuestions = new Map(prevQuestions);

                    nextQuestions.forEach((question, id) => {
                        const newSection = sectionMap.get(question.sectionIdx);

                        if (newSection !== undefined) {
                            nextQuestions.set(id, {
                                ...question,
                                sectionIdx: newSection,
                            });
                        }
                    });

                    // Normalize question order inside each section
                    const grouped = new Map<number, [number, QuestionCore][]>();

                    nextQuestions.forEach((question, id) => {
                        const arr = grouped.get(question.sectionIdx) ?? [];
                        arr.push([id, question]);
                        grouped.set(question.sectionIdx, arr);
                    });

                    grouped.forEach((list) => {
                        [...list]
                            .sort((a, b) => a[1].index - b[1].index)
                            .forEach(([id, question], order) => {
                                nextQuestions.set(id, {
                                    ...question,
                                    index: order,
                                });
                            });
                    });

                    return nextQuestions;
                });

                return nextSections;
            });
        },
        []
    );

    const [activeFormID, setActiveFormID] = useState<string | null>(null);

    const isLoadedRef = useRef(false);
    const skipNextSaveRef = useRef(false);

    /**
     * form Loading
     * load form from DB when activeFormID changes
     */
    useEffect(() => {
        async function loadFormFromDB() {
            if (!activeFormID) return;
            isLoadedRef.current = false;
            skipNextSaveRef.current = true;

            try {
                const formData = await formRepository.get(activeFormID);
                if (!formData) return;
                const { sections, questions, ...rest } = formData;

                setForm({
                    name: rest.name,
                    isPrivate: rest.isPrivate,
                    isPublished: rest.isPublished,
                    allowedDomains: rest.allowedDomains ?? [],
                    settings: { ...rest.settings },
                    responseCount: rest.responseCount ?? 0,
                    // Forms saved before the theme existed have no value; the
                    // base palette is the intended default.
                    theme: rest.theme ?? DEFAULT_FORM_THEME,
                } satisfies Required<FormCore>);

                // Records cached before sections carried an `_id` would be
                // rejected by the bulk sync, so repair them on the way in.
                // The save effect persists the repaired ids.
                const withIds = <T extends { _id?: string }>(rows: T[]): T[] =>
                    rows.map((row) =>
                        row?._id ? row : { ...row, _id: generateObjectId() }
                    );

                if (sections?.length) {
                    const sectionMap = new Map<number, SectionCore>();

                    withIds(sections)
                        .sort((a, b) => a.index - b.index)
                        .forEach((section) => {
                            sectionMap.set(section.index, section);
                        });

                    setSections(sectionMap);
                    nextSectionIndexRef.current = sectionMap.size;
                }

                if (questions?.length) {
                    const questionMap = new Map<number, QuestionCore>();

                    withIds(questions).forEach((question, id) => {
                        questionMap.set(id, question);
                    });

                    setQuestions(questionMap);
                    nextQuestionIndexRef.current = questionMap.size;
                }
            } catch (error) {
                console.error('Error loading form from DB:', error);
            } finally {
                isLoadedRef.current = true;
            }
        }
        loadFormFromDB();
    }, [activeFormID]);

    /**
     * form Saving
     * save form to DB with debounce
     */
    const debouncedUpdate = useMemo(
        () =>
            debounce<FormDB>(async (formData: FormDB) => {
                await formRepository.update(formData._id, formData);
            }, 1000),
        []
    );

    function normalizeQuestions(map: QuestionsMap): QuestionCore[] {
        const questions = [...map.values()].sort((a, b) =>
            a.sectionIdx === b.sectionIdx
                ? a.index - b.index
                : a.sectionIdx - b.sectionIdx
        );

        let currentSection = -1;
        let order = 0;

        return questions.map((question) => {
            if (question.sectionIdx !== currentSection) {
                currentSection = question.sectionIdx;
                order = 0;
            }

            return {
                ...question,
                index: order++,
            };
        });
    }

    useEffect(() => {
        async function prepareForm() {
            if (!activeFormID || !isLoadedRef.current) return;

            if (skipNextSaveRef.current) {
                skipNextSaveRef.current = false;
                return;
            }

            const stored = await formRepository.get(activeFormID);
            if (!stored) return;

            // `__v`, `updatedAt` and `isDirty` are owned by the repository -
            // setting them here pinned the version to 0 on every save.
            const formData: FormDB = {
                ...stored,
                ...form,
                sections: [...sections.values()].sort(
                    (a, b) => a.index - b.index
                ),
                questions: normalizeQuestions(questions),
                _id: activeFormID,
            };

            debouncedUpdate(formData);

            await queueChangedFields(stored, formData);
        }
        prepareForm();
    }, [activeFormID, debouncedUpdate, form, questions, sections]);

    /**
     * A pending debounced flush is lost when the editor closes or the tab is
     * hidden, which would strand queued edits until the next visit. Push
     * immediately in those cases - `flushFormNow` collapses concurrent calls,
     * so this cannot double-send alongside the timer.
     */
    useEffect(() => {
        if (!activeFormID) return;

        const flush = () => {
            void flushFormNow(activeFormID).catch((error) => {
                console.warn('[sync] flush on close failed', error);
            });
        };

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') flush();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', flush);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', flush);
            flush();
        };
    }, [activeFormID]);

    const value = useMemo(
        () => ({
            form,
            handleFormChange,

            sections,
            setSections,
            handleSectionsChange,
            handleAddSection,
            updateSectionData,

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
            activeFormID,
            setActiveFormID,
        }),
        [
            form,
            handleFormChange,
            sections,
            handleSectionsChange,
            handleAddSection,
            updateSectionData,
            handleAddQuestion,
            duplicateQuestion,
            deleteQuestion,
            questions,
            updateQuestion,
            reorderQuestions,
            reorderSections,
            deleteSection,
            activeFormID,
        ]
    );

    return (
        <FormCreateContext.Provider value={value}>
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
