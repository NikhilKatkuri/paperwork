import { MongoDocumentMetadata } from './dto';
import { Form } from './types.form';
import { Question } from './types.questions';
import { Section } from './types.sections';

interface sections extends Section {
    id: string;
}

interface Questions extends Question {
    sectionId: string;
}

export interface Template {
    name: string;
    description?: string;
    category: string;
    isFeatured?: boolean;
    form: Omit<Form, 'userId'>;
    sections: sections[];
    questions: Questions[];
}

export interface TemplateDoc extends Template, MongoDocumentMetadata {}
