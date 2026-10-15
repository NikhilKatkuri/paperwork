import Dexie, { type Table } from 'dexie';

export interface UiPreferences {
    id: 'preferences';
    viewAs: 'row' | 'grid';
}

export class UiPreferencesDB extends Dexie {
    preferences!: Table<UiPreferences, string>;

    constructor() {
        super('ui-preferences-db');

        this.version(1).stores({
            preferences: 'id',
        });
    }
}

export const uiPreferencesDB = new UiPreferencesDB();
