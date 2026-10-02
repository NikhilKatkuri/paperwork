import { db, SyncQueueDB } from './sync-queue.db';

/**
 * Stable primary key for a queued change.
 *
 * Using a per-field key instead of a random id means editing the same field 15
 * times collapses to a single row instead of 15, which is what lets a whole
 * editing session flush as one grouped request.
 */
export function syncKey(formId: string, path: string): string {
    return `${formId}::${path}`;
}

/**
 * `synced` is a boolean, which IndexedDB cannot index, so pending/synced
 * selection has to happen in memory rather than through `where()`.
 */
function byCreatedAt(a: SyncQueueDB, b: SyncQueueDB): number {
    return a.createdAt - b.createdAt;
}

export class SyncQueueRepository {
    async add(item: SyncQueueDB) {
        return db.syncQueue.put(item);
    }

    async getPending(formId: string) {
        const rows = await db.syncQueue
            .where('formId')
            .equals(formId)
            .toArray();
        return rows.filter((row) => !row.synced).sort(byCreatedAt);
    }

    /** Every form that still has at least one unsynced change. */
    async getPendingFormIds(): Promise<string[]> {
        const rows = await db.syncQueue.toArray();
        return Array.from(
            new Set(rows.filter((r) => !r.synced).map((r) => r.formId))
        );
    }

    async markSynced(ids: string[]) {
        if (!ids.length) return;

        await db.transaction('rw', db.syncQueue, async () => {
            for (const id of ids) {
                await db.syncQueue.update(id, {
                    synced: true,
                });
            }
        });
    }

    async deleteSynced() {
        const synced = await db.syncQueue
            .filter((row) => row.synced)
            .primaryKeys();

        if (synced.length) await db.syncQueue.bulkDelete(synced);
    }

    /** Drop queued work for a form outright - used when a form is deleted. */
    async deleteForForm(formId: string) {
        await db.syncQueue.where('formId').equals(formId).delete();
    }

    async bulkUpsert(items: SyncQueueDB[]) {
        if (!items.length) return;

        await db.transaction('rw', db.syncQueue, async () => {
            for (const item of items) {
                await db.syncQueue.put(item);
            }
        });
    }
}

export const syncQueueRepository = new SyncQueueRepository();
