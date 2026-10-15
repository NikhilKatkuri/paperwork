import {
    FormEntity,
    FormResponse,
    QuestionEntity,
    SectionEntity,
} from '@paperwork/types';

import { Document } from 'mongoose';

export type MongooseDocument<T> = T & Document;

export type FormDocument = MongooseDocument<FormEntity>;
export type QuestionDocument = MongooseDocument<QuestionEntity>;
export type SectionDocument = MongooseDocument<SectionEntity>;

export type FormResponseDocument = MongooseDocument<FormResponse>;
