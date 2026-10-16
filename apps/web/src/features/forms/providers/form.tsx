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
import { Form, FormDoc, FormDto } from '@paperwork/types';
import formRepository from '../repositories/formRepository';
import { useApiAction } from '@/hooks/useApiAction';
import { http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import { useAuth } from '@/providers';
import useDebouncedCallback from '@/hooks/useDebouncedCallback';

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

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
    const loadedFormIdRef = useRef<string | undefined>(undefined);

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
        const initializeForm = async () => {
            if (!formId) return;
            try {
                if (loadedFormIdRef.current === formId) return;
                loadedFormIdRef.current = formId;
                let formData = await formRepository.get(formId);

                if (!formData) {
                    const res = await loadForm();
                    if (res?.ok && res.data) {
                        formData = {
                            ...res.data,
                            isDirty: false,
                            lastSyncedAt: new Date().toISOString(),
                        };
                        await formRepository.save(formData);
                    }
                }

                if (!formData) {
                    loadedFormIdRef.current = undefined;
                    return;
                }
                const { sections, questions, ...rest } = formData;
                setForm(rest);
                initializeSectionsMap(sections);
                initializeQuestionsMap(questions);
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
                      lastSyncedAt: new Date().toISOString(),
                      isDirty: true,
                  }
                : prev
        );
    }, []);

    async function saveForm() {
        if (!form || !formId || loadedFormIdRef.current !== formId) return;
        const userId = decodedToken?.userId;
        if (!userId) return;
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
            setSaveStatus('saved');
        } catch (error) {
            console.log('Error saving form:', error);
            setSaveStatus('retrying');
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
