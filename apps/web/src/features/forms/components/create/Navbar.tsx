'use client';

import { cn } from '@/utils/cn';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SyncStatus from './SyncStatus';
import PublishButton from './PublishButton';
import FormThemePicker from './FormThemePicker';
import { Tabs } from '@/types';
import { useForm } from '../../providers/form';

interface NavbarProps {
    setMode: (mode: 'questions' | 'settings' | 'responses') => void;
}
const tabs: Tabs[] = ['questions', 'settings', 'responses'];

function Navbar({ setMode }: Readonly<NavbarProps>) {
    const { form, formId, updateFormState } = useForm();
    const pathname = usePathname();
    const currMode: Tabs = pathname?.endsWith('/settings')
        ? 'settings'
        : pathname?.endsWith('/responses')
          ? 'responses'
          : 'questions';

    const hrefFor = (tab: Tabs) =>
        formId
            ? tab === 'questions'
                ? `/forms/c/${formId}`
                : `/forms/c/${formId}/${tab}`
            : '#';

    return (
        <div className="border-theme-form-container-border/70 bg-theme-form-container sticky top-0 z-20 flex min-h-16 w-full items-center gap-3 border-b px-3 py-2 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <Image
                    src="/paperwork_icon-vector-master.svg"
                    alt="Paperwork Icon"
                    height={32}
                    width={32}
                    className="aspect-square h-7 w-7 shrink-0"
                />
                <input
                    type="text"
                    placeholder="Untitled Form"
                    aria-label="Form title"
                    value={form?.name ?? ''}
                    onChange={(e) =>
                        updateFormState((prev) => ({
                            ...prev,
                            name: e.target.value,
                        }))
                    }
                    className="text-theme-form-on-surface focus:border-theme-form-container-active placeholder:text-theme-form-on-surface max-w-52 min-w-0 flex-1 border-b border-transparent bg-transparent text-sm focus:outline-none sm:text-base lg:text-lg"
                />
            </div>

            <nav
                aria-label="Form editor sections"
                className="order-3 hidden shrink-0 items-center gap-1 lg:order-2 lg:flex"
            >
                {tabs.map((tab) => {
                    return (
                        <Link
                            key={tab}
                            href={hrefFor(tab)}
                            aria-current={currMode === tab ? 'page' : undefined}
                            onClick={(event) => {
                                event.preventDefault();
                                setMode(tab);
                            }}
                            className={cn(
                                'text-theme-form-on-surface/70 active:bg-theme-form-container-active/10 rounded-md px-3 py-2 text-sm transition-colors',
                                'hover:bg-theme-form-container-active/10 hover:text-theme-form-on-surface',
                                currMode === tab.toLowerCase() &&
                                    'bg-theme-form-container-active/10 text-theme-form-on-surface font-medium'
                            )}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Link>
                    );
                })}
            </nav>

            <div className="order-2 flex min-w-0 shrink-0 items-center lg:hidden">
                <label htmlFor="form-mode" className="sr-only">
                    Form section
                </label>
                <select
                    id="form-mode"
                    value={currMode}
                    onChange={(e) => setMode(e.target.value as Tabs)}
                    className="border-theme-form-container-border/60 text-theme-form-on-surface max-w-28 rounded-full border bg-transparent px-2.5 py-1.5 text-xs outline-none"
                >
                    {tabs.map((tab) => (
                        <option key={tab} value={tab.toLowerCase()}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
                <SyncStatus />
                <FormThemePicker />
                <PublishButton />
            </div>
        </div>
    );
}

export default Navbar;
