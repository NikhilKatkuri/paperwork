import { Document } from 'mongoose';
import { FormCore, QuestionCore, ResponseCore, SectionCore } from './forms';

interface FormResponseDocument extends ResponseCore, Document {}

interface QuestionDocument extends QuestionCore, Document {
    formId: string;
    sectionId: string;
}

interface SectionDocument extends SectionCore, Document {
    formId: string;
}

interface FormDocument extends FormCore, Document {
    userId: string;
}

export {
    FormDocument,
    SectionDocument,
    QuestionDocument,
    FormResponseDocument,
};
