import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import useSectionManager from '../hooks/useSectionManager';
import useQuestionManager from '../hooks/useQuestionManager';
import {
    Form,
    FormDoc,
    FormDto,
    QuestionTypeEnum,
} from '@paperwork/types';
import formRepository from '../repositories/formRepository';
import { useApiAction } from '@/hooks/useApiAction';
import { http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import { useAuth } from '@/providers';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';
import { syncQueueRepository, syncKey } from '../lib/sync-queue.repository';
import { reportSyncError, scheduleFlush } from '../lib/sync-engine';

type UpdateFormState = (prev: Form) => Partial<Form>;
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'retrying' | 'error';

interface FormContextValue
    extends
        Omit<ReturnType<typeof useSectionManager>, 'initializeSectionsMap'>,
        Omit<ReturnType<typeof useQuestionManager>, 'initializeQuestionsMap'> {
    form: FormDoc | undefined;
    formId: string | undefined;
    setFormId: React.Dispatch<React.SetStateAction<string | undefined>>;
    updateFormState: (updater: UpdateFormState) => void;
    saveStatus: SaveStatus;
}

const KNOWN_QUESTION_TYPES = new Set<string>(
    Object.values(QuestionTypeEnum) as string[]
);

const isValidSection = (s: unknown): boolean =>
    !!s &&
    typeof (s as { id?: unknown }).id === 'string' &&
    ((s as { id: string }).id.length > 0);

const isValidQuestion = (q: unknown): boolean =>
    !!q &&
    typeof (q as { id?: unknown }).id === 'string' &&
    ((q as { id: string }).id.length > 0) &&
    KNOWN_QUESTION_TYPES.has((q as { type?: string }).type ?? '');

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
    const loadedFormIdRef = useRef<string | undefined>(undefined);
    // Set once the initial paint has completed. Guards the autosave effect
    // so opening a form does not enqueue a phantom edit + flush.
    const hydratedRef = useRef(false);

    const { decodedToken } = useAuth();
    const [form, setForm] = useState<FormDoc | undefined>(undefined);
    const [formId, setFormId] = useState<string | undefined>(undefined);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

    const { initializeSectionsMap, sectionsMap, ...s } = useSectionManager();
    const { initializeQuestionsMap, questionsMap, ...q } = useQuestionManager();

    const { execute: loadForm } = useApiAction(async () => {
        if (!formId) {
            throw new Error('Form ID is required to load a form');
        }
        return http.get<FormDto>(endpoints.forms.getFormById(formId));
    });

    useEffect(() => {
        hydratedRef.current = false;
        const initializeForm = async () => {
            if (!formId) return;
            try {
                if (loadedFormIdRef.current === formId) return;
                loadedFormIdRef.current = formId;
                let formData = await formRepository.get(formId);

                // Self-heal poisoned caches: older builds stored raw
                // Mongoose internals (`$__`/`_doc`, no `id`/`type`) when the
                // server serialized documents wrong. Such records crash DnD
                // (keyless items) and question cards (unknown type), so drop
                // them and fall through to the server fetch below.
                if (formData) {
                    const rawSections = formData.sections ?? [];
                    const validSections = rawSections.filter(isValidSection);
                    const sectionIds = new Set(
                        validSections.map((s) => (s as { id: string }).id)
                    );
                    // Questions pointing at a non-existent section are
                    // orphans (a past toolbar bug filed them under compound
                    // DOM ids) — they render nowhere and poison sync.
                    const validQuestions = (formData.questions ?? []).filter(
                        (q) =>
                            isValidQuestion(q) &&
                            sectionIds.has(
                                (q as { sectionId?: string }).sectionId ?? ''
                            )
                    );
                    if (
                        validSections.length === 0 &&
                        rawSections.length > 0
                    ) {
                        // Fully corrupt (no usable section survived) — drop
                        // the record and fall through to the server fetch.
                        // Persisting an empty shell would wipe the server's
                        // sections on the next bulk sync.
                        await formRepository
                            .delete(formId)
                            .catch(() => undefined);
                        formData = undefined;
                    } else if (
                        validSections.length !== rawSections.length ||
                        validQuestions.length !==
                            (formData.questions ?? []).length
                    ) {
                        formData = {
                            ...formData,
                            sections: validSections,
                            questions: validQuestions,
                        };
                        await formRepository
                            .update(formId, {
                                sections: validSections,
                                questions: validQuestions,
                            })
                            .catch(() => undefined);
                    }
                }

                if (!formData) {
                    const res = await loadForm();
                    if (res?.ok && res.data) {
                        formData = {
                            ...res.data,
                            isDirty: false,
                            lastSyncedAt: new Date().toISOString(),
                        };
                        await formRepository.save(formData, { dirty: false });
                    }
                }

                if (!formData) {
                    loadedFormIdRef.current = undefined;
                    return;
                }
                const { sections, questions, ...rest } = formData;
                setForm(rest);
                // Filter again at the boundary: no keyless item may ever
                // reach a SortableContext, and no typeless question may
                // reach a QuestionCard.
                initializeSectionsMap((sections ?? []).filter(isValidSection));
                initializeQuestionsMap(
                    (questions ?? []).filter(isValidQuestion)
                );
                hydratedRef.current = true;

                // Revalidate against the server when the local copy is clean.
                // The cache may predate a publish/rename made elsewhere, which
                // previously left the navbar showing stale state forever.
                if (!formData.isDirty) {
                    loadForm().then(async (res) => {
                        if (!res?.ok || !res.data) return;
                        const current = await formRepository.get(formId);
                        // A user edit in the meantime wins over the refresh.
                        if (current?.isDirty) return;
                        const fresh = {
                            ...res.data,
                            isDirty: false as const,
                            lastSyncedAt: new Date().toISOString(),
                        };
                        await formRepository.save(fresh, { dirty: false });
                        const {
                            sections: freshSections,
                            questions: freshQuestions,
                            ...freshRest
                        } = fresh;
                        setForm(freshRest);
                        initializeSectionsMap(
                            (freshSections ?? []).filter(isValidSection)
                        );
                        initializeQuestionsMap(
                            (freshQuestions ?? []).filter(isValidQuestion)
                        );
                    });
                }
            } catch (error) {
                console.error('Error initializing form:', error);
            }
        };
        initializeForm();
    }, [formId, initializeQuestionsMap, initializeSectionsMap, loadForm]);

    const updateFormState = useCallback((updater: UpdateFormState) => {
        setForm((prev) =>
            prev
                ? {
                      ...prev,
                      ...updater(prev),
                      lastSyncedAt: null,
                      isDirty: true,
                  }
                : prev
        );
    }, []);

    async function saveForm() {
        if (!form || !formId || loadedFormIdRef.current !== formId) return;
        // The autosave effect also fires on the initial paint; persisting
        // then would mark a clean load dirty and enqueue a phantom sync.
        if (!hydratedRef.current) return;
        const userId = decodedToken?.userId;
        if (!userId) {
            // Silent return used to strand edits with no visible reason —
            // surface it so SyncStatus offers a retry after re-login.
            reportSyncError(formId, 'Session expired. Sign in again to sync.');
            setSaveStatus('error');
            return;
        }
        setSaveStatus('saving');
        try {
            const f: FormDto = {
                ...form,
                sections: Array.from(sectionsMap.values()),
                questions: Array.from(questionsMap.values()),
                userId,
                id: formId,
            };

            await formRepository.save(f);

            // Bridge the editor to the sync engine: one collapsed row per
            // form (upsert by stable key) so a session of N edits flushes
            // as a single bulk request. `sections` forces the bulk path,
            // which carries form fields + sections + questions together.
            await syncQueueRepository.add({
                id: syncKey(formId, 'sections'),
                formId,
                operation: 'update',
                path: 'sections',
                value: null,
                createdAt: Date.now(),
                synced: false,
            });
            scheduleFlush(formId);
            setSaveStatus('saved');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Could not save changes locally.';
            reportSyncError(formId, message);
            setSaveStatus('error');
        }
    }

    const deboundedSaveForm = useDebouncedCallback(saveForm, 500);

    useEffect(() => {
        deboundedSaveForm();
    }, [form, sectionsMap, questionsMap, deboundedSaveForm]);

    const values = {
        form,
        formId,
        setFormId,
        updateFormState,
        saveStatus,
        sectionsMap,
        questionsMap,
        ...s,
        ...q,
    };

    return (
        <FormContext.Provider value={values}>{children}</FormContext.Provider>
    );
}

export function useForm(): FormContextValue {
    const context = useContext(FormContext);
    if (context === undefined) {
        throw new Error('useForm must be used within a FormProvider');
    }
    return context;
}
