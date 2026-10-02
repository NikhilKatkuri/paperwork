export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Math.random().toString(36).substring(2, 11);
};

/**
 * Generate a 24-character hex id.
 *
 * Sections and questions must carry an `_id` that Mongo will accept as a primary
 * key (and that `zodObjectId` validates), so a UUID is not usable here. Values
 * are generated client-side so a new section/question can be synced immediately
 * without a round-trip to obtain an id.
 */
export const generateObjectId = (): string => {
    const bytes = new Uint8Array(12);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};
