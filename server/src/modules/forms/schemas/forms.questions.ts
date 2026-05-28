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
        label: { type: String, required: true, maxlength: 100 },
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
export const fieldValidationRuleEnum = [
    'EMAIL',
    'URL',
    'NUMBER_GREATER_THAN',
    'NUMBER_LESS_THAN',
    'REGEX_MATCH',
    'MAX_CHAR_COUNT',
] as const;

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
        lowLabel: { type: String, required: false, maxlength: 50 },
        highLabel: { type: String, required: false, maxlength: 50 },
    },
    { _id: false }
);

const fieldValidationRuleSchema = new Schema(
    {
        ruleType: {
            type: String,
            enum: fieldValidationRuleEnum,
            required: true,
        },
        value: { type: Schema.Types.Mixed, required: false },
        customErrorMessage: { type: String, required: false, maxlength: 200 },
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

        helpText: { type: String, default: '', maxlength: 500 },

        options: { type: [optionSchema], default: undefined },
        dependsOn: { type: questionDependsOnSchema, default: undefined },
        ratingConfig: { type: ratingConfigSchema, default: undefined },
        validationRule: { type: fieldValidationRuleSchema, default: undefined },

        placeholder: { type: String, default: '', maxlength: 100 },
        isRequired: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

questionsSchema.index({ formId: 1, sectionId: 1, index: 1 });
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
