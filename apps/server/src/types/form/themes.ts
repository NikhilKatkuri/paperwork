/**
 * Valid `[data-form-theme]` keys, mirrored by the client picker.
 *
 * Kept as a plain tuple so both the Mongoose enum and the zod validator can
 * consume it without a runtime dependency on the frontend.
 */
export const FORM_THEMES = [
    'default',
    'blue',
    'orange',
    'green',
    'purple',
    'red',
    'teal',
    'amber',
    'slate',
    'emerald',
] as const;

export type FormTheme = (typeof FORM_THEMES)[number];
