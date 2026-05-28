import { Document } from 'mongoose';
import { FormType, QuestionBase, Section } from './forms';

interface QuestionDocument extends QuestionBase, Document {
    formId: string;
    sectionId: string;
}

interface SectionDocument extends Omit<Section, 'questions'>, Document {
    formId: string;
}

interface FormDocument extends Omit<FormType, 'sections'>, Document {
    userId: string;
}

export { FormDocument, SectionDocument, QuestionDocument };
