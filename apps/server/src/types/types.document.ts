import {
    Form,
    FormReference,
    FormResponse,
    Question,
    Section,
    SectionReference,
    Template,
} from '@paperwork/types';

import { Document } from 'mongoose';

export type MongooseDocument<T> = T & Document;

export type FormDocument = MongooseDocument<Form>;
export type QuestionDocument = MongooseDocument<Question & SectionReference>;
export type SectionDocument = MongooseDocument<Section & FormReference>;

export type FormResponseDocument = MongooseDocument<FormResponse>;
export type TemplateDocument = MongooseDocument<Template>;
