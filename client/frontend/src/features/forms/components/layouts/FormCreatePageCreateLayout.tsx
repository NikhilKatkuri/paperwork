'use client';

import { useEffect, useState } from 'react';
import Navbar from '../create/Navbar';
import FormLayout from '../form';
import Settings from '../create/Settings';
import ResponsesPanel from '../create/responses/ResponsesPanel';
import { Tabs } from '../../types';
import { useParams } from 'next/navigation';
import { useFormCreate } from '../../providers/FormCreate';
import { pageTitle, useDocumentTitle } from '@/lib/useDocumentTitle';
import {
    DEFAULT_FORM_THEME,
    FORM_THEME_ATTR,
    FORM_THEMES,
    type FormThemeId,
} from '@/lib/formTheme';

function Render({ _case }: Readonly<{ _case: Tabs }>) {
    switch (_case) {
        case 'questions':
            return <FormLayout />;
        case 'settings':
            return <Settings />;
        case 'responses':
            return <ResponsesPanel />;
    }
}

function FormCreatePageCreateLayout() {
    const [mode, setMode] = useState<Tabs>('questions');
    const { id } = useParams();

    const { setActiveFormID, form } = useFormCreate();

    useDocumentTitle(pageTitle(form?.name));
    useEffect(() => {
        function updateFormId() {
            if (!id || typeof id !== 'string') return;
            setActiveFormID(id);
        }
        updateFormId();
    }, [id, setActiveFormID]);

    /*
     * The editor previews the form in the theme the form itself carries, so
     * what you see while designing is what a respondent gets. The account-wide
     * theme on <html> is left alone - only this subtree is overridden - so the
     * rest of the app keeps the user's own preference.
     */
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
            <Navbar currMode={mode} setMode={setMode} />
            <div className="bg-theme-form-surface min-h-0 w-full flex-1">
                <Render _case={mode} />
            </div>
        </div>
    );
}

export default FormCreatePageCreateLayout;
