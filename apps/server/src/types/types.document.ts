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

/** On the server the bin marker is a Date; the wire serialises it to ISO. */
export type FormDocument = MongooseDocument<
    Omit<Form, 'deletedAt'> & { deletedAt?: Date }
>;
export type QuestionDocument = MongooseDocument<Question & SectionReference>;
export type SectionDocument = MongooseDocument<Section & FormReference>;

export type FormResponseDocument = MongooseDocument<FormResponse>;
export type TemplateDocument = MongooseDocument<Template>;
