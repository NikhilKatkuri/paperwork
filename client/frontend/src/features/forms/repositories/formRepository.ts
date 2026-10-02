import { db, FormDB } from '@/lib/db';
import { toTimestamp, toVersion } from '@/features/forms/types/db.types';

/**
 * Project a server record onto the local cache.
 *
 * Fields absent from the response are kept from `local`: the list endpoint
 * returns a summary projection with no `sections`/`questions`, and replacing the
 * record outright would discard a locally cached draft of the form body.
 *
 * Local sync bookkeeping (`isDirty`, `syncedAt`) is deliberately *not* taken
 * from the server - it has no opinion about whether the local copy has unsaved
 * edits, and inheriting a stale value would mark unsynced work as pushed and let
 * the next fetch discard it.
 */
function mergeServerForm(local: FormDB | undefined, remote: FormDB): FormDB {
    return {
        ...(local ?? {}),
        ...remote,
        createdAt: toTimestamp(remote.createdAt ?? local?.createdAt),
        updatedAt: toTimestamp(remote.updatedAt ?? local?.updatedAt),
        __v: toVersion(remote.__v ?? local?.__v),
        sections: remote.sections ?? local?.sections ?? [],
        questions: remote.questions ?? local?.questions ?? [],
        isDirty: false,
        syncedAt: undefined,
    };
}

/** Most recently touched first. */
function byRecency(a: FormDB, b: FormDB): number {
    return toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
}

class FormRepository {
    /**
     * Apply a server snapshot to the local cache.
     *
     * Records with pending local edits are skipped so an incoming snapshot can
     * never destroy unsaved work; everything else is overwritten with the
     * server's copy.
     */
    async seedMany(forms: FormDB[]): Promise<void> {
        if (!forms.length) return;

        await db.transaction('rw', db.forms, async () => {
            const locals = await db.forms.bulkGet(forms.map((f) => f._id));
            const rows: FormDB[] = [];

            forms.forEach((remote, i) => {
                if (locals[i]?.isDirty) return;
                rows.push(mergeServerForm(locals[i], remote));
            });

            if (rows.length) await db.forms.bulkPut(rows);
        });
    }

    // Apply a single server snapshot.
    async seed(form: FormDB): Promise<void> {
        await this.seedMany([form]);
    }

    // Create or update from a local edit.
    async save(form: FormDB): Promise<void> {
        await db.forms.put({
            ...form,
            createdAt: toTimestamp(form.createdAt, Date.now()),
            updatedAt: Date.now(),
            __v: toVersion(form.__v) + 1,
            isDirty: true,
        });
    }

    // Get one form draft
    async get(uid: string): Promise<FormDB | undefined> {
        return db.forms.get(uid);
    }

    // Check if draft exists
    async exists(uid: string): Promise<boolean> {
        return (await db.forms.get(uid)) !== undefined;
    }

    // Delete draft
    async delete(uid: string): Promise<void> {
        await db.forms.delete(uid);
    }

    // Get all drafts (latest first)
    async getAll(): Promise<FormDB[]> {
        return db.forms.orderBy('updatedAt').reverse().toArray();
    }

    async select<K extends keyof FormDB>(
        keys: K[]
    ): Promise<Pick<FormDB, K>[]> {
        const forms = await this.getAll();

        return forms.map((form) => {
            const result = {} as Pick<FormDB, K>;

            keys.forEach((key) => {
                result[key] = form[key];
            });

            return result;
        });
    }

    // Mark as synced after successful API call
    async markSynced(uid: string): Promise<void> {
        await db.forms.update(uid, {
            isDirty: false,
            syncedAt: Date.now(),
        });
    }

    // Get all forms waiting for sync.
    // `isDirty` is a boolean, which IndexedDB cannot index - filter in memory.
    async getDirtyForms(): Promise<FormDB[]> {
        const dirty = await db.forms.filter((form) => form.isDirty).toArray();
        return dirty.sort(byRecency);
    }

    // Merge a partial local edit into an existing record.
    // The version is derived from the stored record, never from `updates`.
    async update(uid: string, updates: Partial<FormDB>): Promise<void> {
        await db.transaction('rw', db.forms, async () => {
            const existing = await db.forms.get(uid);
            if (!existing) return;

            await db.forms.put({
                ...existing,
                ...updates,
                _id: uid,
                createdAt: toTimestamp(existing.createdAt),
                updatedAt: Date.now(),
                __v: toVersion(existing.__v) + 1,
                isDirty: true,
            });
        });
    }

    async clear(): Promise<void> {
        await db.forms.clear();
    }
}

const formRepository = new FormRepository();
export default formRepository;