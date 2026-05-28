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

export const questionEnum = [
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
export const ratingIconEnum = ['STAR', 'HEART', 'THUMB_UP'] as const;

const ratingConfigSchema = new Schema(
    {
        icon: {
            type: String,
            enum: ratingIconEnum,
            required: true,
            default: 'STAR',
        },
        scale: {
            type: Number,
            enum: [5, 10],
            required: true,
            default: 5,
        },
    },
    { _id: false }
);
const questionsSchema = new Schema<QuestionDocument>(
    {
        formId: { type: String, required: true, index: true },
        sectionId: { type: String, required: true, index: true },
        index: { type: Number, required: true, default: 0 },
        type: { type: String, enum: questionEnum, required: true },
        question: { type: String, required: true },
        dependsOn: { type: questionDependsOnSchema, default: undefined },
        options: { type: [optionSchema], default: undefined },
        ratingConfig: { type: ratingConfigSchema, default: undefined },
    },
    {
        timestamps: true,
    }
);

questionsSchema.index({ formId: 1, sectionId: 1, index: 1 }, { unique: true });
questionsSchema.set('toObject', {
    transform: (_, ret) => {
        Reflect.deleteProperty(ret, '__v');
        return ret;
    },
});

const QuestionsModel = mongoose.model<QuestionDocument>(
    'Question',
    questionsSchema
);

export default QuestionsModel;
