import Dexie, { Table } from 'dexie';
import { FormDB } from '@/types';
import type { TemplateSummary } from '@/features/forms/api/user/templates';

/**
 * Small key/value store for per-device preferences such as the form theme.
 *
 * IndexedDB rather than localStorage so preferences live and are cleared with
 * the rest of the app's local data.
 */
export interface PreferenceRecord {
    key: string;
    value: unknown;
    updatedAt: number;
}

/**
 * Cached template catalogue. A single record (`id: 'catalog'`) holds the
 * whole list plus the time it was fetched, which drives the weekly refresh.
 */
export interface TemplateCacheRecord {
    id: string;
    templates: TemplateSummary[];
    fetchedAt: number;
}

export function generateObjectId(): string {
    const timestamp = Math.floor(Date.now() / 1000)
        .toString(16)
        .padStart(8, '0');

    // Generate 16 random hex characters (8 bytes) for the random/counter part
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);

    const randomHex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return timestamp + randomHex;
}
class PaperworkDB extends Dexie {
    forms!: Table<FormDB, string>;
    preferences!: Table<PreferenceRecord, string>;
    templates!: Table<TemplateCacheRecord, string>;

    constructor() {
        super('PaperworkDB');

        this.version(1).stores({
            forms: 'id, updatedAt, isPublished',
            preferences: 'key, updatedAt',
        });

        this.version(2).stores({
            templates: 'id, fetchedAt',
        });
    }
}

export const db = new PaperworkDB();
