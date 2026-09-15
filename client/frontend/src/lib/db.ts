import FormCore from '@/features/forms/types/form.type';
import QuestionCore from '@/features/forms/types/question.type';
import SectionCore from '@/features/forms/types/section.type';
import Dexie, { Table } from 'dexie';

interface TimeStamp {
    _id: string;
    version: number;
    isDirty: boolean;
    syncedAt?: number;
    createdAt: number;
    updatedAt: number;
}

interface SectionDB extends SectionCore {
    _id: string;
    formId: string;
}

interface QuestionDB extends QuestionCore {
    _id: string;
    formId: string;
    sectionId: string;
}

export interface FormDB extends FormCore, TimeStamp {
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
    }
}

export const db = new PaperworkDB();
