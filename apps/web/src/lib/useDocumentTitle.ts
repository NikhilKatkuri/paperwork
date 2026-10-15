'use client';

import { useEffect } from 'react';

export const APP_NAME = 'Paperwork';

/**
 * Set the document title, restoring the previous one on unmount.
 *
 * The Metadata API cannot be used for this route: it is a client component and
 * the form title is only known once the API responds - which needs the access
 * token held in memory, so it is not available during a server render.
 */
export function useDocumentTitle(title?: string | null): void {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const previous = document.title;

        if (title) {
            document.title = title;
        }

        return () => {
            document.title = previous;
        };
    }, [title]);
}

/** `Paperwork | <form name>`, or just the app name when there is no title. */
export function pageTitle(subject?: string | null): string {
    const trimmed = subject?.trim();

    return trimmed ? `${APP_NAME} | ${trimmed}` : APP_NAME;
}
