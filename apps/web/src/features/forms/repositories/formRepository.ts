import { db } from '@/lib/db';
import {
    toISOString,
    toTimestamp,
    toVersion,
} from '@/features/forms/types/db.types';
import { FormDB } from '@/types';
import { FormDto } from '@paperwork/types';

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
        ...local,
        ...remote,
        createdAt: toISOString(remote.createdAt ?? local?.createdAt),
        updatedAt: toISOString(remote.updatedAt ?? local?.updatedAt),
        v: toVersion(remote.v ?? local?.v),
        sections: remote.sections ?? local?.sections ?? [],
        questions: remote.questions ?? local?.questions ?? [],
        isDirty: false,
        lastSyncedAt: null,
    };
}

function byRecency(a: FormDB, b: FormDB): number {
    return toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
}

class FormRepository {
    async get(uid: string): Promise<FormDB | undefined> {
        return db.forms.get(uid);
    }

    async exists(uid: string): Promise<boolean> {
        return (await db.forms.get(uid)) !== undefined;
    }

    async delete(uid: string): Promise<void> {
        await db.forms.delete(uid);
    }

    async getAll(): Promise<FormDB[]> {
        return db.forms.orderBy('updatedAt').reverse().toArray();
    }

    async save(form: FormDto, opts?: { dirty?: boolean }): Promise<void> {
        const dirty = opts?.dirty ?? true;
        await db.forms.put({
            ...form,
            createdAt: toISOString(form.createdAt),
            updatedAt: toISOString(form.updatedAt),
            v: toVersion(form.v) + 1,
            isDirty: dirty,
            lastSyncedAt: dirty ? null : toISOString(Date.now()),
        });
    }

    async markSynced(uid: string): Promise<void> {
        await db.forms.update(uid, {
            isDirty: false,
            lastSyncedAt: toISOString(Date.now()),
        });
    }

    async seedMany(forms: FormDB[]): Promise<void> {
        if (!forms.length) return;

        await db.transaction('rw', db.forms, async () => {
            const locals = await db.forms.bulkGet(forms.map((f) => f.id));
            const rows: FormDB[] = [];

            forms.forEach((remote, i) => {
                if (locals[i]?.isDirty) return;
                rows.push(mergeServerForm(locals[i], remote));
            });

            if (rows.length) await db.forms.bulkPut(rows);
        });
    }

    async seed(form: FormDB): Promise<void> {
        await this.seedMany([form]);
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

    async getDirtyForms(): Promise<FormDB[]> {
        const dirty = await db.forms.filter((form) => form.isDirty).toArray();
        return dirty.sort(byRecency);
    }

    async update(uid: string, updates: Partial<FormDB>): Promise<void> {
        await db.transaction('rw', db.forms, async () => {
            const existing = await db.forms.get(uid);
            if (!existing) return;

            await db.forms.put({
                ...existing,
                ...updates,
                id: uid,
                createdAt: toISOString(existing.createdAt),
                updatedAt: toISOString(Date.now()),
                v: toVersion(existing.v) + 1,
                isDirty: true,
            });
        });
    }

    private rankMatch(haystack: string, needle: string): number {
        if (haystack === needle) return 0;
        if (haystack.startsWith(needle)) return 1;
        return 2;
    }

    async searchLocal(
        term: string,
        limit: number = 10
    ): Promise<{ id: string; name: string }[]> {
        const needle = term.trim().toLowerCase();

        if (!needle) return [];

        const ranked: { hit: { id: string; name: string }; rank: number }[] =
            [];

        for (const form of await this.getAll()) {
            const name = form.name ?? '';
            const haystack = name.toLowerCase();

            if (!haystack.includes(needle)) continue;

            ranked.push({
                hit: { id: form.id, name: name.trim() ?? 'Untitled form' },
                rank: this.rankMatch(haystack, needle),
            });
        }

        // Array.prototype.sort is stable, so equal ranks keep recency order.
        ranked.sort((a, b) => a.rank - b.rank);

        return ranked.slice(0, limit).map((entry) => entry.hit);
    }

    /**
     * Record a field the server has already confirmed.
     *
     * Deliberately does not mark the form dirty - the value came *from* the
     * server, so queueing it would schedule a pointless sync of a change that
     * has already been applied.
     */
    async setPublished(uid: string, isPublished: boolean): Promise<void> {
        await db.forms.update(uid, { isPublished, isDirty: false });
    }

    async clear(): Promise<void> {
        await db.forms.clear();
    }
}

const formRepository = new FormRepository();
export default formRepository;
