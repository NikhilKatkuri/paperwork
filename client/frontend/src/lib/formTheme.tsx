/**
 * Form theme variants, backed by the `[data-form-theme]` blocks in
 * `theme.css`.
 *
 * The ids here are the single source of truth: the server enum mirrors them,
 * and every theme - `default` included - has a matching selector, so a swatch
 * never depends on what it happens to inherit.
 */
export const FORM_THEMES = [
    { id: 'default', label: 'Indigo' },
    { id: 'blue', label: 'Sky Blue' },
    { id: 'orange', label: 'Orange' },
    { id: 'green', label: 'Green' },
    { id: 'purple', label: 'Purple' },
    { id: 'red', label: 'Rose Red' },
    { id: 'teal', label: 'Teal' },
    { id: 'amber', label: 'Amber / Gold' },
    { id: 'slate', label: 'Slate Grey' },
    { id: 'emerald', label: 'Emerald' },
] as const;

import { db } from './db';
import { cn } from '@/utils/cn';

export type FormThemeId = (typeof FORM_THEMES)[number]['id'];

export const FORM_THEME_ATTR = 'data-form-theme';

export const FORM_THEME_STORAGE_KEY = 'paperwork:form-theme';

export const DEFAULT_FORM_THEME: FormThemeId = 'default';

function isFormThemeId(value: unknown): value is FormThemeId {
    return FORM_THEMES.some((theme) => theme.id === value);
}

/**
 * Apply the theme to the document element.
 *
 * `default` removes the attribute rather than setting it, so `:root` in
 * `theme.css` keeps ownership of the base palette.
 */
export function applyFormTheme(id: FormThemeId): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (id === DEFAULT_FORM_THEME) {
        root.removeAttribute(FORM_THEME_ATTR);
    } else {
        root.setAttribute(FORM_THEME_ATTR, id);
    }
}

export function readStoredFormTheme(): FormThemeId {
    if (typeof window === 'undefined') return DEFAULT_FORM_THEME;

    try {
        const stored = window.localStorage.getItem(FORM_THEME_STORAGE_KEY);

        return isFormThemeId(stored) ? stored : DEFAULT_FORM_THEME;
    } catch {
        // Storage can be unavailable in private modes.
        return DEFAULT_FORM_THEME;
    }
}

export function storeFormTheme(id: FormThemeId): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(FORM_THEME_STORAGE_KEY, id);
    } catch {
        // A failed write only means the choice is not remembered.
    }
}

/*
 * IndexedDB is the durable store, but it is asynchronous and so cannot be read
 * by the inline pre-paint script. localStorage is therefore kept as a
 * synchronous mirror of the same value: the script applies it before first
 * paint to avoid a flash of the default palette, and IndexedDB is reconciled
 * in on mount and is what a fresh read consults.
 */
const PREFERENCE_KEY = 'form-theme';

export async function readFormThemeFromDb(): Promise<FormThemeId | null> {
    try {
        const record = await db.preferences.get(PREFERENCE_KEY);

        if (!record || !isFormThemeId(record.value)) return null;

        return record.value;
    } catch (error) {
        console.warn('[theme] could not read preference', error);

        return null;
    }
}

/** Persist to IndexedDB, mirroring to localStorage for the pre-paint script. */
export async function persistFormTheme(id: FormThemeId): Promise<void> {
    storeFormTheme(id);

    try {
        await db.preferences.put({
            key: PREFERENCE_KEY,
            value: id,
            updatedAt: Date.now(),
        });
    } catch (error) {
        // The mirror already holds the value, so the theme still applies.
        console.warn('[theme] could not persist preference', error);
    }
}
/**
 * Applies the stored theme before first paint.
 *
 * Inlined into the document head: doing this from an effect would paint the
 * default palette first and then repaint, which reads as a flash on every
 * reload. Kept dependency-free and defensive because it runs before hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var k=${JSON.stringify(FORM_THEME_STORAGE_KEY)};
var a=${JSON.stringify(FORM_THEME_ATTR)};
var v=localStorage.getItem(k);
if(v&&v!==${JSON.stringify(DEFAULT_FORM_THEME)}){document.documentElement.setAttribute(a,v);}
}catch(e){}})();`;

/**
 * Colour chip for a theme, rendered from the stylesheet rather than a literal.
 *
 * The attribute goes on the chip itself, so the chip resolves that theme's
 * palette instead of inheriting the surrounding one - which matters twice over:
 * the `default` chip stays indigo even while the editor is themed, and the chip
 * follows the active colour scheme, since `--theme-form-container-active` is
 * redefined under the dark media query.
 */
export function FormThemeSwatch({
    id,
    className,
}: {
    id: FormThemeId;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            data-form-theme={id}
            className={cn(
                'bg-theme-form-container-active inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10',
                className
            )}
        />
    );
}
