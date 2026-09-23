import { db, SyncQueueDB } from './sync-queue.db';

export class SyncQueueRepository {
    async add(item: SyncQueueDB) {
        return db.syncQueue.put(item);
    }

    async getPending(formId: string) {
        return db.syncQueue
            .where({ formId, synced: false })
            .sortBy('createdAt');
    }

    async markSynced(ids: string[]) {
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
            .where('synced')
            .equals(1)
            .primaryKeys();

        await db.syncQueue.bulkDelete(synced);
    }

    async bulkUpsert(items: SyncQueueDB[]) {
        await db.transaction('rw', db.syncQueue, async () => {
            for (const item of items) {
                await db.syncQueue.put(item);
            }
        });
    }
}

export const syncQueueRepository = new SyncQueueRepository();
