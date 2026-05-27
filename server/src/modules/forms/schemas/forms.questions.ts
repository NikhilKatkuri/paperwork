import { QuestionDocument } from '@/types/form/Document';
import mongoose, { Schema } from 'mongoose';

const questionDependsOnSchema = new Schema(
    {
        questionId: { type: String, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

const optionSchema = new Schema(
    {
        index: { type: Number, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

const questionEnum = [
    'TEXT',
    'PARAGRAPH',
    'CHOICE',
    'RADIO',
    'DROP_DOWN',
    'LINEAR_SCALE',
    'RATING',
    'DATE',
    'TIME',
] as const;

const questionsSchema = new Schema<QuestionDocument>(
    {
        formId: { type: String, required: true, index: true },
        sectionId: { type: String, required: true, index: true },
        type: { type: String, enum: questionEnum, required: true },
        question: { type: String, required: true },
        dependsOn: { type: questionDependsOnSchema, default: undefined },
        options: { type: [optionSchema], default: undefined },
    },
    {
        timestamps: true,
    }
);

questionsSchema.index({ formId: 1, sectionId: 1 });
const QuestionsModel = mongoose.model<QuestionDocument>(
    'Question',
    questionsSchema
);

export default QuestionsModel;
