'use client';

import { cn } from '@/utils/cn';
import Image from 'next/image';
import { Tabs } from '../../types';
import { useFormCreate } from '../../providers/FormCreate';
import SyncStatus from './SyncStatus';

interface NavbarProps {
    currMode: Tabs;
    setMode: (mode: Tabs) => void;
}
const tabs: Tabs[] = ['questions', 'settings', 'responses'];

function Navbar({ currMode, setMode }: Readonly<NavbarProps>) {
    const { form, handleFormChange: patch } = useFormCreate();

    return (
        <div className="border-theme-form-container-border/70 sticky top-0 h-16 w-full border-b px-2 py-4 md:grid md:h-32 md:grid-cols-1 md:grid-rows-2 md:p-4 md:px-6">
            <div className="flex items-center justify-between">
                <div className="flex w-full max-w-52 items-center justify-center gap-2">
                    <Image
                        src="/paperwork_icon-vector-master.svg"
                        alt="Paperwork Icon"
                        height={32}
                        width={32}
                        className="aspect-square h-6 md:h-8"
                    />
                    <input
                        type="text"
                        placeholder="Untitled Form"
                        value={form?.name ?? ''}
                        onChange={(e) => patch('name', e.target.value)}
                        className="text-theme-form-on-surface focus:border-theme-form-container-active placeholder:text-theme-form-on-surface w-full flex-1 border-b border-transparent bg-transparent focus:outline-none lg:text-lg"
                    />
                </div>
                <SyncStatus />
            </div>
            <div className="flex h-full items-center justify-center max-md:hidden">
                <div className="grid h-full w-80 grid-cols-3 gap-1">
                    {tabs.map((tab) => {
                        return (
                            <button
                                key={tab}
                                onClick={() =>
                                    setMode(tab.toLowerCase() as Tabs)
                                }
                                className={cn(
                                    'active:bg-theme-form-container-active/10 h-full flex-1 rounded-t-md border-b-3 transition-all ease-in-out',
                                    'hover:bg-theme-form-container-active/10 hover:border-theme-form-container-active border-transparent',
                                    currMode === tab.toLowerCase() &&
                                        'bg-theme-form-container-active/10 border-theme-form-container-active'
                                )}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Navbar;
