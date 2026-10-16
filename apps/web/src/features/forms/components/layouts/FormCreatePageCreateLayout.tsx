'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Navbar from '../create/Navbar';
import { useParams, useRouter } from 'next/navigation';
import { pageTitle, useDocumentTitle } from '@/lib/useDocumentTitle';
import {
    DEFAULT_FORM_THEME,
    FORM_THEME_ATTR,
    FORM_THEMES,
    type FormThemeId,
} from '@/lib/formTheme';
import { useForm } from '../../providers/form';

function FormCreatePageCreateLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    const { setFormId, form, saveStatus } = useForm();
    useDocumentTitle(pageTitle(form?.name));

    const { id } = useParams<{ id: string | string[] }>();
    const router = useRouter();

    useEffect(() => {
        if (typeof id !== 'string' || !id) return;
        setFormId(id);
    }, [id, setFormId]);

    const hasUnsavedChanges =
        saveStatus === 'unsaved' ||
        saveStatus === 'saving' ||
        saveStatus === 'retrying' ||
        saveStatus === 'error';

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const setMode = (nextMode: 'questions' | 'settings' | 'responses') => {
        if (typeof id !== 'string' || !id) return;

        if (
            hasUnsavedChanges &&
            !window.confirm(
                'You have unsaved changes. Leave this page and risk losing them?'
            )
        ) {
            return;
        }

        router.push(
            nextMode === 'questions'
                ? `/forms/c/${id}`
                : `/forms/c/${id}/${nextMode}`
        );
    };

    const requested = form?.theme;
    const formTheme: FormThemeId =
        requested && FORM_THEMES.some((t) => t.id === requested)
            ? requested
            : DEFAULT_FORM_THEME;

    return (
        <div
            {...{ [FORM_THEME_ATTR]: formTheme }}
            className="flex h-screen w-full flex-col"
        >
            <Navbar setMode={setMode} />
            <div className="bg-theme-form-surface min-h-0 w-full flex-1">
                {children}
            </div>
        </div>
    );
}

export default FormCreatePageCreateLayout;
