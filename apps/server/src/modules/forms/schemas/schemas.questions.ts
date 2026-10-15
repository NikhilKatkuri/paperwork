import { QuestionDocument } from '@/types';
import mongoose, { Schema } from 'mongoose';
import transform from '@/schemas/tranformer';

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
        label: { type: String, required: true, maxlength: 100 },
    },
    { _id: false }
);

const optionConfigSchema = new Schema(
    {
        options: { type: [optionSchema], required: true },
        expectedAnswer: { type: Schema.Types.Mixed, required: false },
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
    'MATRIX',
] as const;

const OPTION_BASED_TYPES = ['CHOICE', 'RADIO', 'DROP_DOWN'] as const;

export const ratingIconEnum = ['STAR', 'HEART', 'THUMB_UP'] as const;
export const fieldValidationRuleEnum = [
    'EMAIL',
    'URL',
    'NUMBER_GREATER_THAN',
    'NUMBER_LESS_THAN',
    'REGEX_MATCH',
    'MAX_CHAR_COUNT',
    'NUMBER_BETWEEN',
    'MIN_CHAR_COUNT',
    'CHECKBOX_MIN_SELECT',
    'CHECKBOX_MAX_SELECT',
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
            required: true,
            min: 3,
            max: 9,
            default: 5,
        },
        lowLabel: { type: String, required: false, maxlength: 50 },
        highLabel: { type: String, required: false, maxlength: 50 },
    },
    { _id: false }
);

const matrixRowSchema = new Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
    },
    { _id: false }
);

const matrixColumnSchema = new Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
    },
    { _id: false }
);

const matrixConfigSchema = new Schema(
    {
        rows: { type: [matrixRowSchema], required: true },
        columns: { type: [matrixColumnSchema], required: true },
        allowMultiplePerColumn: { type: Boolean, default: false },
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
        min: { type: Number, required: false },
        max: { type: Number, required: false },
        pattern: { type: String, required: false, maxlength: 200 },
        customErrorMessage: { type: String, required: false, maxlength: 200 },
    },
    { _id: false }
);

const questionsSchema = new Schema<QuestionDocument>(
    {
        formId: { type: String, required: true, index: true },
        sectionId: { type: String, required: true, index: true },
        index: { type: Number, required: true, default: 0, min: 0 },
        slug: { type: String, required: true, index: true },

        type: { type: String, enum: questionEnum, required: true },
        question: { type: String, required: true, maxlength: 500 },

        helpText: { type: String, default: '', maxlength: 500 },

        optionsConfig: { type: optionConfigSchema, default: undefined },
        dependsOn: { type: questionDependsOnSchema, default: undefined },
        ratingConfig: { type: ratingConfigSchema, default: undefined },
        matrixConfig: { type: matrixConfigSchema, default: undefined },
        validationRule: { type: fieldValidationRuleSchema, default: undefined },

        placeholder: { type: String, default: '', maxlength: 100 },
        isRequired: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

questionsSchema.index({ formId: 1, sectionId: 1, index: 1 });

questionsSchema.pre('validate', function (this: QuestionDocument) {
    const isOptionBased = (OPTION_BASED_TYPES as readonly string[]).includes(
        this.type
    );
    if (
        isOptionBased &&
        (!this.optionsConfig || this.optionsConfig.options.length === 0)
    ) {
        throw new Error(`${this.type} questions require at least one option`);
    }
    if (
        !isOptionBased &&
        this.optionsConfig &&
        this.optionsConfig.options.length > 0
    ) {
        throw new Error(
            `options are only valid for ${OPTION_BASED_TYPES.join(', ')} questions`
        );
    }

    if (
        (this.type === 'RATING' || this.type === 'LINEAR_SCALE') &&
        !this.ratingConfig
    ) {
        throw new Error(`${this.type} questions require ratingConfig`);
    }

    if (this.type === 'MATRIX' && !this.matrixConfig) {
        throw new Error('MATRIX questions require matrixConfig');
    }

    if (this.optionsConfig && this.optionsConfig.options.length > 0) {
        const indices = this.optionsConfig.options.map((opt) => opt.index);
        if (new Set(indices).size !== indices.length) {
            throw new Error('options must have unique index values');
        }
    }
});

questionsSchema.set('toObject', { transform });
questionsSchema.set('toJSON', { transform });

const QuestionsModel = mongoose.model<QuestionDocument>(
    'Question',
    questionsSchema
);

export default QuestionsModel;
