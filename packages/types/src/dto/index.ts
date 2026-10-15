import { Form } from '../types.form';
import { Question } from '../types.questions';
import { Section } from '../types.sections';

/**
 * Entities
 */

export interface SectionEntity extends Section {
    formId: string;
}

export interface FormEntity extends Form {
    userId: string;
}

export interface QuestionEntity extends Question {
    formId: string;
    sectionId: string;
}

/**
 * DTO
 */

interface MongoDocumentMetadata {
    // reference to the document in the database
    id: string;
    // version key for the document in the database
    v?: number;

    updatedAt: string;
    createdAt: string;
    deletedAt?: string;
}

export interface QuestionDto extends QuestionEntity, MongoDocumentMetadata {}
export interface SectionDto extends SectionEntity, MongoDocumentMetadata {}

export interface FormEntityDto extends FormEntity, MongoDocumentMetadata {}

export interface FormDto extends FormEntity, MongoDocumentMetadata {
    sections: SectionDto[];
    questions: QuestionDto[];
}
