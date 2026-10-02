import { BaseDocument } from '@/features/forms/types/db.types';
import FormCore from '@/features/forms/types/form.type';
import QuestionCore from '@/features/forms/types/question.type';
import SectionCore from '@/features/forms/types/section.type';
import Dexie, { Table } from 'dexie';

interface LocalDocument extends BaseDocument {
    isDirty: boolean;
    syncedAt?: number;
}

export interface SectionDB extends SectionCore {
    _id: string;
    formId: string;
}

export interface QuestionDB extends QuestionCore {
    _id: string;
    formId: string;
    sectionId: string;
}

export interface FormDB extends FormCore, LocalDocument {
    sections: SectionCore[];
    questions: QuestionCore[];
}

class PaperworkDB extends Dexie {
    forms!: Table<FormDB, string>;

    constructor() {
        super('PaperworkDB');

        this.version(1).stores({
            forms: '_id, updatedAt, version, isDirty, isPublished',
        });

        /**
         * `version` was never a real field - the document version is `__v`, so
         * that index was always dead. `isDirty` is a boolean and IndexedDB
         * cannot index booleans, so it could never be queried either.
         */
        this.version(2).stores({
            forms: '_id, updatedAt, isPublished',
        });
    }
}

export const db = new PaperworkDB();
