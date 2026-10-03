import { BaseDocument } from '@/features/forms/types/db.types';
import FormCore from '@/features/forms/types/form.type';
import QuestionCore from '@/features/forms/types/question.type';
import SectionCore from '@/features/forms/types/section.type';
import Dexie, { Table } from 'dexie';
import { generateObjectId } from '@/features/forms/utils';

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

/**
 * Small key/value store for per-device preferences such as the form theme.
 *
 * IndexedDB rather than localStorage so preferences live and are cleared with
 * the rest of the app's local data.
 */
export interface PreferenceRecord {
    key: string;
    value: unknown;
    updatedAt: number;
}

class PaperworkDB extends Dexie {
    forms!: Table<FormDB, string>;
    preferences!: Table<PreferenceRecord, string>;

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

        /**
         * Data migration, no schema change: records cached before sections and
         * questions carried an `_id` would be rejected by the bulk sync
         * ("expected string, received undefined") and fail the whole batch.
         *
         * Ids are backfilled here rather than at send time on purpose - a
         * per-sync id would change on every flush, orphaning GO_TO_SECTION
         * targets that reference them.
         */
        this.version(3)
            .stores({
                forms: '_id, updatedAt, isPublished',
            })
            .upgrade(async (tx) => {
                await tx
                    .table('forms')
                    .toCollection()
                    .modify((form: FormDB) => {
                        const sections = Array.isArray(form.sections)
                            ? form.sections
                            : [];
                        const questions = Array.isArray(form.questions)
                            ? form.questions
                            : [];

                        form.sections = sections.map((section) =>
                            section?._id
                                ? section
                                : { ...section, _id: generateObjectId() }
                        );
                        form.questions = questions.map((question) =>
                            question?._id
                                ? question
                                : { ...question, _id: generateObjectId() }
                        );
                    });
            });

        this.version(4).stores({
            forms: '_id, updatedAt, isPublished',
            preferences: 'key, updatedAt',
        });
    }
}

export const db = new PaperworkDB();
