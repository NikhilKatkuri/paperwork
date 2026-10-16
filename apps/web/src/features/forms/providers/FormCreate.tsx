// 'use client';

// import {
//     createContext,
//     useCallback,
//     useContext,
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
//     type ReactNode,
// } from 'react';

// import { DEFAULT_FORM_THEME } from '@/lib/formTheme';

// import { FormCreateContextValue, QuestionsMap, Section } from '../types';
// import { arrayMove } from '@dnd-kit/sortable';
// import formRepository from '../repositories/formRepository';
// import { debounce } from '@/features/common/utils';
// import { syncQueueRepository, syncKey } from '../lib/sync-queue.repository';
// import { scheduleFlush, flushFormNow } from '../lib/sync-engine';
// import { SyncQueueDBType } from '../lib/sync-queue.db';
// import { generateObjectId } from '../utils';
// import getFormServerById from '../api/user/getFormServer';
// import SectionCore from '../types/section.type';
// import QuestionCore from '../types/question.type';
// import {
//     FormDto,
//     FormEntity,
//     FormEntityDto,
//     SectionEntity,
// } from '@paperwork/types';
// import { FormDB } from '@/types';
// import { createDefaultForm } from '../utils/default';

// const FormCreateContext = createContext<FormCreateContextValue | undefined>(
//     undefined
// );

// type Form = Omit<FormEntity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// export function FormCreateProvider({
//     children,
// }: Readonly<{ children: ReactNode }>) {
//     const [questions, setQuestions] = useState<QuestionsMap>(() => {
//         return new Map([[0, createDefaultQuestion()]]);
//     });

//     const [sections, setSections] = useState<Map<number, SectionEntity>>(() => {
//         return new Map<number, SectionEntity>([]);
//     });

//     const [form, setForm] = useState<Map<string, unknown>>(
//         new Map<string, unknown>([['name', 'Untitled Form']])
//     );

//     const handleFormChange = useCallback(
//         <k extends keyof Form>(key: k, value: Form[k]) => {
//             if (form === null) return;
//             setForm((prev) =>
//                 prev[key] === value ? prev : { ...prev, [key]: value }
//             );
//         },
//         [form]
//     );

//     const reorderQuestions = useCallback(
//         (sectionIdx: number, activeId: number, overId: number) => {
//             setQuestions((prev) => {
//                 const sectionQuestions = Array.from(prev.entries())
//                     .filter(([, q]) => q.sectionIdx === sectionIdx)
//                     .sort((a, b) => a[1].index - b[1].index);

//                 const activeIndex = sectionQuestions.findIndex(
//                     ([id]) => id === activeId
//                 );
//                 const overIndex = sectionQuestions.findIndex(
//                     ([id]) => id === overId
//                 );

//                 if (activeIndex === -1 || overIndex === -1) return prev;

//                 const reordered = arrayMove(
//                     sectionQuestions,
//                     activeIndex,
//                     overIndex
//                 );

//                 const next = new Map(prev);

//                 reordered.forEach(([id, question], index) => {
//                     next.set(id, {
//                         ...question,
//                         index,
//                     });
//                 });

//                 return next;
//             });
//         },
//         []
//     );

//     const reorderSections = useCallback(
//         (activeKey: number, overKey: number) => {
//             setSections((prevSections) => {
//                 const entries = [...prevSections.entries()].sort(
//                     (a, b) => a[1].index - b[1].index
//                 );

//                 const activeIndex = entries.findIndex(
//                     ([id]) => id === activeKey
//                 );

//                 const overIndex = entries.findIndex(([id]) => id === overKey);

//                 if (
//                     activeIndex === -1 ||
//                     overIndex === -1 ||
//                     activeIndex === overIndex
//                 ) {
//                     return prevSections;
//                 }

//                 const reordered = arrayMove(entries, activeIndex, overIndex);

//                 const nextSections = new Map<number, SectionCore>();

//                 reordered.forEach(([id, section], index) => {
//                     nextSections.set(id, {
//                         ...section,
//                         index,
//                     });
//                 });

//                 nextSectionIndexRef.current = nextSections.size;

//                 return nextSections;
//             });
//         },
//         []
//     );

//     const [activeFormID, setActiveFormID] = useState<string | null>(null);

//     /**
//      * A pending debounced flush is lost when the editor closes or the tab is
//      * hidden, which would strand queued edits until the next visit. Push
//      * immediately in those cases - `flushFormNow` collapses concurrent calls,
//      * so this cannot double-send alongside the timer.
//      */
//     useEffect(() => {
//         if (!activeFormID) return;

//         const flush = () => {
//             void flushFormNow(activeFormID).catch((error) => {
//                 console.warn('[sync] flush on close failed', error);
//             });
//         };

//         const onVisibility = () => {
//             if (document.visibilityState === 'hidden') flush();
//         };

//         document.addEventListener('visibilitychange', onVisibility);
//         window.addEventListener('pagehide', flush);

//         return () => {
//             document.removeEventListener('visibilitychange', onVisibility);
//             window.removeEventListener('pagehide', flush);
//             flush();
//         };
//     }, [activeFormID]);

//     const value: FormCreateContextValue = useMemo(
//         () => ({
//             form,
//             handleFormChange,

//             sections,
//             setSections,
//             handleSectionsChange,
//             handleAddSection,
//             updateSectionData,

//             reorderQuestions,
//             reorderSections,
//             deleteSection,
//             activeFormID,
//             setActiveFormID,
//         }),
//         [
//             form,
//             handleFormChange,
//             sections,
//             handleSectionsChange,
//             handleAddSection,
//             updateSectionData,
//             handleAddQuestion,
//             duplicateQuestion,
//             deleteQuestion,
//             questions,
//             updateQuestion,
//             reorderQuestions,
//             reorderSections,
//             deleteSection,
//             activeFormID,
//         ]
//     );

//     return (
//         <FormCreateContext.Provider value={value}>
//             {children}
//         </FormCreateContext.Provider>
//     );
// }

// export function useFormCreate() {
//     const context = useContext(FormCreateContext);
//     if (context === undefined) {
//         throw new Error(
//             'useFormCreate must be used within a FormCreateProvider'
//         );
//     }
//     return context;
// }
