'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import {
    DEFAULT_FORM_THEME,
    FORM_THEMES,
    FormThemeSwatch,
    type FormThemeId,
} from '@/lib/formTheme';
import { useFormCreate } from '../../providers/FormCreate';

/**
 * Chooses the colour theme of the form being edited.
 *
 * The choice is stored on the form document and synced like any other field, so
 * it travels with the form to whoever fills it in - see `FormViewPageLayout`,
 * which scopes the theme to its own container.
 */
export default function FormThemePicker() {
    const { form, handleFormChange, activeFormID } = useFormCreate();

    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    if (!activeFormID) return null;

    const current = form?.theme ?? DEFAULT_FORM_THEME;
    const active =
        FORM_THEMES.find((theme) => theme.id === current) ?? FORM_THEMES[0];

    return (
        <div ref={rootRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Form theme: ${active.label}`}
                title="Form theme"
                className="hover:bg-theme-form-surface-hover flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            >
                <FormThemeSwatch id={current} />
            </button>

            {open ? (
                <div className="bg-theme-surface border-theme-form-container-border/60 absolute top-full right-0 z-50 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-xl border p-2 shadow-lg">
                    <div
                        role="listbox"
                        aria-label="Form theme"
                        className="grid grid-cols-2 gap-1"
                    >
                        {FORM_THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                role="option"
                                aria-selected={theme.id === current}
                                type="button"
                                onClick={() => {
                                    handleFormChange('theme', theme.id);
                                    setOpen(false);
                                }}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors',
                                    theme.id === current
                                        ? 'border-theme-form-container-active bg-theme-form-container-active/10'
                                        : 'hover:bg-theme-form-on-surface/5 border-transparent'
                                )}
                            >
                                <FormThemeSwatch
                                    id={theme.id}
                                    className="h-6 w-6"
                                />
                                <span className="text-theme-form-on-surface text-center text-[11px] leading-tight">
                                    {theme.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export type { FormThemeId };
