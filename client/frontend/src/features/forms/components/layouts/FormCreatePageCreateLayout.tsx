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

    return (
        <div className="flex h-screen w-full flex-col">
            <Navbar currMode={mode} setMode={setMode} />
            <div className="bg-theme-form-surface min-h-0 w-full flex-1">
                <Render _case={mode} />
            </div>
        </div>
    );
}

export default FormCreatePageCreateLayout;
