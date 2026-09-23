import Dexie, { Table } from 'dexie';

export interface SyncQueueDB {
    id: string;

    formId: string;

    operation: 'create' | 'update' | 'delete';

    path: string;

    value: unknown;

    createdAt: number;

    synced: boolean;
}

export class syncQueueDB extends Dexie {
    syncQueue!: Table<SyncQueueDB>;

    constructor() {
        super('sync-queue-db');

        this.version(1).stores({
            forms: '_id, updatedAt, isDirty',
            syncQueue: 'id, formId, synced, createdAt',
        });
    }
}

export const db = new syncQueueDB();
