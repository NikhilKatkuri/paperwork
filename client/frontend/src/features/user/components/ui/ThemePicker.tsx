'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { cn } from '@/utils/cn';
import {
    DEFAULT_FORM_THEME,
    FORM_THEME_ATTR,
    FORM_THEMES,
    applyFormTheme,
    persistFormTheme,
    readFormThemeFromDb,
    type FormThemeId,
} from '@/lib/formTheme';

const THEME_CHANGE_EVENT = 'paperwork:form-theme-change';

/** What is actually applied to the document right now. */
function readAppliedTheme(): FormThemeId {
    const attr = document.documentElement.getAttribute(FORM_THEME_ATTR);

    return FORM_THEMES.some((theme) => theme.id === attr)
        ? (attr as FormThemeId)
        : DEFAULT_FORM_THEME;
}

function subscribe(onChange: () => void) {
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    // Keeps other tabs in step when the choice changes elsewhere.
    window.addEventListener('storage', onChange);

    return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, onChange);
        window.removeEventListener('storage', onChange);
    };
}

interface ThemePickerProps {
    /** Extra classes for the trigger, so it can match a host layout. */
    className?: string;
    /** Optional caption under the swatch, matching the sidebar's icon labels. */
    label?: string;
}

/**
 * Swatch picker for the `[data-form-theme]` variants.
 *
 * The choice is applied to the document element and stored, so it survives a
 * reload; `ThemeScript` in the root layout re-applies it before first paint.
 */
export default function ThemePicker({ className, label }: ThemePickerProps) {
    const [open, setOpen] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    /**
     * Read the applied theme from the DOM rather than mirroring it into state.
     * The inline script sets the attribute before hydration, so the server
     * rendered "default" while the client may already be on another theme -
     * `useSyncExternalStore` reconciles that without a mismatch warning.
     */
    const selected = useSyncExternalStore(
        subscribe,
        readAppliedTheme,
        () => DEFAULT_FORM_THEME
    );

    /**
     * IndexedDB is the durable record; the inline script only ever sees the
     * localStorage mirror. Reconcile once on mount so a theme saved while the
     * mirror was missing or stale still takes effect.
     */
    useEffect(() => {
        let alive = true;

        readFormThemeFromDb().then((stored) => {
            if (!alive || !stored) return;

            if (stored !== readAppliedTheme()) {
                applyFormTheme(stored);
                // Re-sync the mirror so the pre-paint script agrees next load.
                persistFormTheme(stored);
                window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
            }
        });

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;

            setOpen(false);
            buttonRef.current?.focus();
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const choose = useCallback((id: FormThemeId) => {
        applyFormTheme(id);
        // Writes IndexedDB and mirrors to localStorage for the pre-paint script.
        void persistFormTheme(id);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        setOpen(false);
    }, []);

    const active = FORM_THEMES.find((theme) => theme.id === selected);

    return (
        <div
            ref={rootRef}
            className={cn(
                'relative shrink-0',
                label && 'flex flex-col items-center'
            )}
        >
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Form theme: ${active?.label ?? 'Default'}`}
                title="Change form theme"
                className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                    'hover:bg-theme-form-surface-hover',
                    className
                )}
            >
                <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: active?.swatch }}
                />
            </button>

            {label ? (
                <p className="text-theme-on-surface mt-0.5 text-center text-[12px] font-normal">
                    {label}
                </p>
            ) : null}

            {open ? (
                <div
                    /*
                     * The rail sits against the left edge of the viewport, so
                     * the list is anchored to the trigger's *left* edge and
                     * grows rightwards - anchoring to its right edge pushed the
                     * panel off the left of the screen.
                     *
                     * Vertically it depends on the rail: under 44rem the rail
                     * is a fixed bar along the bottom, so the list becomes a
                     * bottom sheet to clear it; above that the rail is a
                     * full-height column and the list hangs below the trigger.
                     */
                    className={cn(
                        'bg-theme-surface border-theme-form-container-border/60 z-50 max-h-[70vh] w-72 overflow-y-auto rounded-xl border p-2 shadow-lg',
                        'max-[44rem]:fixed max-[44rem]:inset-x-4 max-[44rem]:bottom-[5.25rem] max-[44rem]:w-auto',
                        'min-[44rem]:absolute min-[44rem]:top-full min-[44rem]:left-0 min-[44rem]:mt-2'
                    )}
                >
                    {/*
                     * Two columns of stacked swatch tiles: a single column of
                     * ten options is taller than most viewports.
                     */}
                    <div
                        role="listbox"
                        aria-label="Form theme"
                        className="grid grid-cols-2 gap-1"
                    >
                        {FORM_THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                role="option"
                                aria-selected={theme.id === selected}
                                type="button"
                                onClick={() => choose(theme.id)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors',
                                    theme.id === selected
                                        ? 'border-theme-form-container-active bg-theme-form-container-active/10'
                                        : 'hover:bg-theme-form-on-surface/5 border-transparent'
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className="h-6 w-6 rounded-full ring-1 ring-black/10"
                                    style={{
                                        backgroundColor: theme.swatch,
                                    }}
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
