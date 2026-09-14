import { db, FormDB } from '@/lib/db';

class FormRepository {
    // Create or Update (upsert)
    async save(form: FormDB): Promise<void> {
        await db.forms.put({
            ...form,
            updatedAt: Date.now(),
            version: form.version + 1,
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
        const forms = await db.forms.orderBy('updatedAt').reverse().toArray();

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

    // Get all forms waiting for sync
    async getDirtyForms(): Promise<FormDB[]> {
        return db.forms.where('isDirty').equals(1).toArray();
    }

    // Update only part of a form
    async update(
        uid: string,
        updates: Partial<Omit<FormDB, 'uid'>>
    ): Promise<void> {
        await db.forms.update(uid, {
            ...updates,
            updatedAt: Date.now(),
            version: Date.now(),
            isDirty: true,
        });
    }

    async clear(): Promise<void> {
        await db.forms.clear();
    }
}

const formRepository = new FormRepository();
export default formRepository;
