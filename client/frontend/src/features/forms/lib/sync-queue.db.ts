import Dexie, { Table } from 'dexie';

export interface SyncQueueDBType {
    id: string;

    formId: string;

    operation: 'create' | 'update' | 'delete';

    path: string;

    value: unknown;

    createdAt: number;

    synced: boolean;
}

export class SyncQueueDB extends Dexie {
    syncQueue!: Table<SyncQueueDBType>;

    constructor() {
        super('sync-queue-db');

        this.version(1).stores({
            forms: '_id, updatedAt, isDirty',
            syncQueue: 'id, formId, synced, createdAt',
        });

        /**
         * Drop the `forms` store (duplicated the one in `PaperworkDB` and never
         * read from here) and the `synced` index - IndexedDB cannot index
         * booleans, so pending rows were unfindable through it.
         */
        this.version(2).stores({
            syncQueue: 'id, formId, createdAt',
        });
    }
}

const syncQueueDB = new SyncQueueDB();
export default syncQueueDB;