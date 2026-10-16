export interface BaseDocument {
    _id: string;
    createdAt?: number;
    updatedAt?: number;
    __v: number;
}

/**
 * Coerce a timestamp from an API payload into epoch milliseconds.
 *
 * The API serialises Mongo date fields as ISO strings while local writes use
 * `Date.now()`. IndexedDB orders keys by value *and type*, so persisting a mix
 * of strings, `Date` objects and numbers makes `orderBy('updatedAt')` return
 * effectively random results.
 */
export function toTimestamp(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return fallback;
}

export function toISOString(
    value: unknown,
    fallback: string = new Date().toISOString()
): string {
    if (!value) return fallback;

    if (value instanceof Date) {
        return !Number.isNaN(value.getTime()) ? value.toISOString() : fallback;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) ? date.toISOString() : fallback;
    }

    if (typeof value === 'string') {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) ? date.toISOString() : fallback;
    }

    return fallback;
}

/** Coerce a document version into a finite number, defaulting to 0. */
export function toVersion(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

type Document<T> = T & BaseDocument;

export default Document;
