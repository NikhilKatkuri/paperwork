'use client';

import { useEffect, useState } from 'react';
import Navbar from '../create/Navbar';
import FormLayout from '../form';
import Settings from '../create/Settings';
import { useParams } from 'next/navigation';
import { pageTitle, useDocumentTitle } from '@/lib/useDocumentTitle';
import {
    DEFAULT_FORM_THEME,
    FORM_THEME_ATTR,
    FORM_THEMES,
    type FormThemeId,
} from '@/lib/formTheme';
import { useForm } from '../../providers/form';
import { Tabs } from '@/types';

function Render({ _case }: Readonly<{ _case: Tabs }>) {
    switch (_case) {
        case 'questions':
            return <FormLayout />;
        case 'settings':
            return <Settings />;
        case 'responses':
            return null;
    }
}

function FormCreatePageCreateLayout() {
    const [mode, setMode] = useState<Tabs>('questions');

    const { setFormId, form } = useForm();
    useDocumentTitle(pageTitle(form?.name));

    const { id } = useParams<{ id: string | string[] }>();

    useEffect(() => {
        if (typeof id !== 'string' || !id) return;
        setFormId(id);
    }, [id, setFormId]);

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
