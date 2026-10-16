import { Form } from '../types.form';
import { Question } from '../types.questions';
import { FormResponse } from '../types.response';
import { Section } from '../types.sections';

export interface MongoDocumentMetadata {
    id: string;
    v: number;

    updatedAt: string;
    createdAt: string;
    deletedAt?: string;
}

/**
 * refereneces
 */

interface FormReference {
    formId: string;
}

interface SectionReference extends FormReference {
    sectionId: string;
}

/**
 *  objects
 */

interface FormDoc extends Form, MongoDocumentMetadata {}
interface SectionDoc extends Section, MongoDocumentMetadata, FormReference {}
interface QuestionDoc
    extends Question, MongoDocumentMetadata, SectionReference {}

interface FormResponseDto extends FormResponse, MongoDocumentMetadata {}

interface CreateFormDoc extends Omit<Form, 'userId'> {
    section: Section;
    questions: Question[];
}
/**
 * DTO's
 */

interface CreateFormDto extends FormReference, FormDoc {
    section: Section;
    questions: Question[];
}

interface FormDto extends FormDoc {
    sections: SectionDoc[];
    questions: QuestionDoc[];
}

export type {
    FormReference,
    SectionReference,
    FormDoc,
    SectionDoc,
    QuestionDoc,
    CreateFormDto,
    FormDto,
    FormResponseDto,
    CreateFormDoc,
};
