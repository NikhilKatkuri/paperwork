import storage_buckets from '@/config';
import storageService from '@/providers/StorageService';
import { db } from '@/lib/db';
import syncQueueDB from '@/features/forms/lib/sync-queue.db';

/** Prefix used by typeahead result caches (`formsearch:<term>`). */
const FORM_SEARCH_PREFIX = 'formsearch:';

/** Client-only keys outside `storage_buckets`. */
const TEMPLATE_RECENTS_KEY = 'template-recents';
const FORM_THEME_KEY = 'paperwork:form-theme';

/**
 * Wipes every client-side cache that can hold user data: localStorage
 * buckets, per-term form-search results, recent-template ids, the form
 * theme and the IndexedDB stores (including the unsynced-edit queue).
 *
 * Called on sign-out and whenever a token refresh proves the session is
 * gone, so a shared device never shows the previous user's data to the
 * next one.
 */
export async function clearClientCaches(): Promise<void> {
    if (typeof window !== 'undefined') {
        for (const key of Object.values(storage_buckets)) {
            storageService.remove(key as string);
        }

        storageService.remove(TEMPLATE_RECENTS_KEY);
        storageService.remove(FORM_THEME_KEY);

        // Search hits are keyed per term, so they cannot be removed by a
        // fixed key list; enumerate and remove every cache entry.
        try {
            const searchKeys: string[] = [];
            for (let index = 0; index < window.localStorage.length; index++) {
                const key = window.localStorage.key(index);
                if (key?.startsWith(FORM_SEARCH_PREFIX)) {
                    searchKeys.push(key);
                }
            }
            for (const key of searchKeys) {
                window.localStorage.removeItem(key);
            }
        } catch {
            /* storage disabled or full; nothing else to do */
        }
    }

    try {
        await db.forms.clear();
    } catch {
        /* IndexedDB unavailable (SSR/private mode) */
    }
    try {
        await syncQueueDB.syncQueue.clear();
    } catch {
        /* IndexedDB unavailable (SSR/private mode) */
    }
    try {
        await db.preferences.clear();
    } catch {
        /* IndexedDB unavailable (SSR/private mode) */
    }
}
