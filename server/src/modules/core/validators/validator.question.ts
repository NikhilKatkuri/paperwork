import { z } from 'zod';
import {
    fieldValidationRuleEnum,
    ratingIconEnum,
} from '@/modules/core/schemas/schemas.questions';
import { zodObjectId } from './validator.sections';

export const getAllQuestionsSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
});

export const getQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
        questionId: zodObjectId,
    }),
});

const dependsOnSchema = z.object({
    questionId: z
        .string()
        .regex(
            /^[0-9a-fA-F]{24}$/,
            'Invalid questionId format (must be valid MongoDB ObjectId)'
        ),
    value: z.string().min(1, 'Value cannot be empty'),
});

const optionSchema = z.object({
    index: z.number().int().nonnegative(),
    value: z.string().min(1, 'Value cannot be empty'),
    label: z.string().max(100, 'Label cannot exceed 100 characters'),
});

const ratingConfigSchema = z.object({
    icon: z.enum(ratingIconEnum),
    scale: z.union([z.literal(5), z.literal(10)]),
    lowLabel: z
        .string()
        .max(50, 'Low label cannot exceed 50 characters')
        .optional(),
    highLabel: z
        .string()
        .max(50, 'High label cannot exceed 50 characters')
        .optional(),
});

const fieldValidationRuleSchema = z.object({
    ruleType: z.enum(fieldValidationRuleEnum),
    value: z.union([z.string(), z.number()]).optional(),
    customErrorMessage: z
        .string()
        .max(200, 'Custom error message cannot exceed 200 characters')
        .optional(),
});

const baseQuestionSchema = z.object({
    question: z
        .string()
        .min(1, 'Question cannot be empty')
        .max(1000, 'Question cannot exceed 1000 characters'),
    dependsOn: dependsOnSchema.optional(),
    validationRule: fieldValidationRuleSchema.optional(),

    helpText: z
        .string()
        .max(500, 'Help text cannot exceed 500 characters')
        .default(''),
    isRequired: z.boolean().default(false),
    placeholder: z
        .string()
        .max(100, 'Placeholder cannot exceed 100 characters')
        .default(''),
});

export const questionSchema = z.discriminatedUnion('type', [
    baseQuestionSchema.extend({ type: z.literal('TEXT') }),
    baseQuestionSchema.extend({ type: z.literal('PARAGRAPH') }),
    baseQuestionSchema.extend({ type: z.literal('DATE') }),
    baseQuestionSchema.extend({ type: z.literal('TIME') }),
    baseQuestionSchema.extend({
        type: z.literal('CHOICE'),
        options: z
            .array(optionSchema)
            .min(1, 'At least one option is required'),
    }),
    baseQuestionSchema.extend({
        type: z.literal('RADIO'),
        options: z
            .array(optionSchema)
            .min(1, 'At least one option is required'),
    }),
    baseQuestionSchema.extend({
        type: z.literal('DROP_DOWN'),
        options: z
            .array(optionSchema)
            .min(1, 'At least one option is required'),
    }),
    baseQuestionSchema.extend({
        type: z.literal('LINEAR_SCALE'),
        ratingConfig: ratingConfigSchema,
    }),
    baseQuestionSchema.extend({
        type: z.literal('RATING'),
        ratingConfig: ratingConfigSchema,
    }),
]);

export const createQuestionSchema = z.object({
    body: z.object({
        data: questionSchema,
    }),
});

export const bulkCreateQuestionSchema = z.object({
    body: z.object({
        data: z
            .array(questionSchema)
            .min(1, 'At least one question is required'),
    }),
});

export const updateQuestionSchema = z.object({
    body: z.object({
        data: questionSchema,
    }),
});

export const reorderQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
    body: z.object({
        data: z.array(
            z.object({
                questionId: zodObjectId,
                index: z
                    .number()
                    .min(0, 'Index must be a non-negative integer'),
            })
        ),
    }),
});

export const fillFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
});

export const postFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
    body: z.object({
        data: z.array(
            z.object({
                questionId: zodObjectId,
                values: z
                    .array(z.string())
                    .min(1, 'At least one value is required'),
            })
        ),
    }),
});
