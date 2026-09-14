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

const OPTION_BASED_TYPES = ['CHOICE', 'RADIO', 'DROP_DOWN'] as const;

export const ratingIconEnum = ['STAR', 'HEART', 'THUMB_UP'] as const;
export const fieldValidationRuleEnum = [
    'EMAIL',
    'URL',
    'NUMBER_GREATER_THAN',
    'NUMBER_LESS_THAN',
    'REGEX_MATCH',
    'MAX_CHAR_COUNT',
    'NUMBER_EQUAL_TO',
    'NUMBER_BETWEEN',
    'MIN_CHAR_COUNT',
    'DATE_IS_BEFORE',
    'DATE_IS_AFTER',
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

        type: { type: String, enum: questionEnum, required: true },
        question: { type: String, required: true, maxlength: 500 },

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

function validateFieldValidationRule(rule: {
    ruleType: (typeof fieldValidationRuleEnum)[number];
    value?: unknown;
    min?: number;
    max?: number;
    pattern?: string;
}): string | null {
    switch (rule.ruleType) {
        case 'REGEX_MATCH':
            if (!rule.pattern) return 'REGEX_MATCH requires a pattern';
            break;
        case 'NUMBER_GREATER_THAN':
        case 'NUMBER_LESS_THAN':
        case 'NUMBER_EQUAL_TO':
            if (typeof rule.value !== 'number')
                return `${rule.ruleType} requires a numeric value`;
            break;
        case 'NUMBER_BETWEEN':
            if (rule.min === undefined || rule.max === undefined)
                return 'NUMBER_BETWEEN requires both min and max';
            if (rule.min >= rule.max)
                return 'NUMBER_BETWEEN requires min to be less than max';
            break;
        case 'MAX_CHAR_COUNT':
        case 'MIN_CHAR_COUNT':
        case 'CHECKBOX_MIN_SELECT':
        case 'CHECKBOX_MAX_SELECT':
            if (typeof rule.value !== 'number' || rule.value < 0)
                return `${rule.ruleType} requires a non-negative numeric value`;
            break;
        case 'DATE_IS_BEFORE':
        case 'DATE_IS_AFTER':
            if (!rule.value) return `${rule.ruleType} requires a value`;
            break;
        case 'EMAIL':
        case 'URL':
            break;
        default:
            return null;
    }
    return null;
}

questionsSchema.index({ formId: 1, sectionId: 1, index: 1 });

questionsSchema.pre('validate', function (this: QuestionDocument) {
    const isOptionBased = (OPTION_BASED_TYPES as readonly string[]).includes(
        this.type
    );

    if (isOptionBased && (!this.options || this.options.length === 0)) {
        throw new Error(`${this.type} questions require at least one option`);
    }
    if (!isOptionBased && this.options && this.options.length > 0) {
        throw new Error(
            `options are only valid for ${OPTION_BASED_TYPES.join(', ')} questions`
        );
    }

    if (this.type === 'RATING' && !this.ratingConfig) {
        throw new Error('RATING questions require ratingConfig');
    }
    if (this.type !== 'RATING' && this.ratingConfig) {
        throw new Error('ratingConfig is only valid for RATING questions');
    }

    if (this.options && this.options.length > 0) {
        const indices = this.options.map((opt) => opt.index);
        if (new Set(indices).size !== indices.length) {
            throw new Error('options must have unique index values');
        }
    }

    if (this.validationRule) {
        const ruleError = validateFieldValidationRule(this.validationRule);
        if (ruleError) throw new Error(ruleError);
    }

    if (
        this.dependsOn?.questionId &&
        this._id &&
        this.dependsOn.questionId === this._id.toString()
    ) {
        throw new Error('A question cannot depend on itself');
    }
});

const transform = (_doc: unknown, ret: any) => {
    Reflect.deleteProperty(ret, '__v');
    return ret;
};

questionsSchema.set('toObject', { transform });
questionsSchema.set('toJSON', { transform });

const QuestionsModel = mongoose.model<QuestionDocument>(
    'Question',
    questionsSchema
);

export default QuestionsModel;
