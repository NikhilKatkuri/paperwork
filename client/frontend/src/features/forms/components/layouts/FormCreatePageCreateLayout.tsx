'use client';

import { useState } from 'react';
import Navbar from '../create/Navbar';
import QuestionsLayout from '../Questions';
import Settings from '../create/Settings';
import { Tabs } from '../../types'; 

function Render({ _case }: { _case: Tabs }) {
    switch (_case) {
        case 'questions':
            return <QuestionsLayout />;
        case 'settings':
            return <Settings />;
        case 'responses':
            return <div>Responses</div>;
    }
}

function FormCreatePageCreateLayout() {
    const [mode, setMode] = useState<Tabs>('questions');

    return (
        <div className="flex h-screen w-full flex-col">
            <Navbar currMode={mode} setMode={setMode} />
            <div className="bg-theme-form-surface min-h-0 w-full flex-1">
                {Render({ _case: mode })}
            </div>
        </div>
    );
}

export default FormCreatePageCreateLayout;
