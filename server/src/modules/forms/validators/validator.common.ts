import { z } from 'zod';

import {
    fieldValidationRuleEnum,
    ratingIconEnum,
} from '../schemas/schemas.questions';
import { sectionActionEnum } from '../schemas/schemas.sections';

export const zodObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Database ID format');

export const formSettingsSchema = z
    .object({
        maxResponses: z.number().int().positive().nullable().optional(),
        maxResponsesPerUser: z.number().int().positive().nullable().optional(),
        closeDate: z.coerce.date().nullable().optional(),
        startDate: z.coerce.date().nullable().optional(),
        timeLimitPerResponse: z.number().int().positive().nullable().optional(),
        collectEmail: z.boolean().default(false),
        shuffleQuestions: z.boolean().default(false),
        allowEditResponse: z.boolean().default(false),
        saveAndContinueLater: z.boolean().default(false),
        progressBar: z.boolean().default(false),
        customConfirmationMessage: z.string().max(1000).nullable().optional(),
        redirectUrl: z.string().url().nullable().optional(),
    })
    .strict();

export const formDataSchema = z
    .object({
        name: z.string().min(1).max(255),
        isPrivate: z.boolean().default(false),
        isPublished: z.boolean().default(false),
        allowedDomains: z.array(z.string()).optional(),
        settings: formSettingsSchema.optional(),
        responseCount: z.number().int().nonnegative().optional(),
    })
    .strict();

export const sectionActionSchema = z.discriminatedUnion('actionType', [
    z.object({ actionType: z.literal('NEXT_SECTION') }),
    z.object({ actionType: z.literal('SUBMIT_FORM') }),
    z.object({
        actionType: z.literal('GO_TO_SECTION'),
        sectionId: zodObjectId,
    }),
]);

export const sectionDependsOnSchema = z.object({
    questionId: zodObjectId,
    value: z.string().min(1),
    action: sectionActionSchema,
});

export const sectionDataSchema = z
    .object({
        index: z.number().int().nonnegative(),
        title: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        defaultAction: sectionActionSchema.optional(),
        onAnswer: z.array(sectionDependsOnSchema).optional(),
    })
    .strict();

export const dependsOnSchema = z.object({
    questionId: zodObjectId,
    value: z.string().min(1),
});

export const optionSchema = z.object({
    index: z.number().int().nonnegative(),
    label: z.string().max(100),
});

export const optionsConfigSchema = z.object({
    correctAnswer: z.string().optional(),
    options: z.array(optionSchema).min(1),
});

export const ratingConfigSchema = z.object({
    icon: z.enum(ratingIconEnum),
    scale: z.union([z.literal(5), z.literal(10)]),
    lowLabel: z.string().max(50).optional(),
    highLabel: z.string().max(50).optional(),
});

export const validationRuleSchema = z.object({
    ruleType: z.enum(fieldValidationRuleEnum),
    value: z.union([z.string(), z.number()]).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    customErrorMessage: z.string().max(200).optional(),
});

export const questionBaseSchema = z.object({
    question: z.string().min(1).max(1000),
    helpText: z.string().max(500).optional(),
    dependsOn: dependsOnSchema.optional(),
    validationRule: validationRuleSchema.optional(),
    placeholder: z.string().max(100).optional(),
    isRequired: z.boolean().default(false),
});

const questionTypes = [
    'TEXT',
    'PARAGRAPH',
    'DATE',
    'TIME',
    'CHOICE',
    'RADIO',
    'DROP_DOWN',
    'LINEAR_SCALE',
    'RATING',
] as const;

export const questionDataSchema = z.discriminatedUnion('type', [
    questionBaseSchema.extend({ type: z.literal('TEXT') }),
    questionBaseSchema.extend({ type: z.literal('PARAGRAPH') }),
    questionBaseSchema.extend({ type: z.literal('DATE') }),
    questionBaseSchema.extend({ type: z.literal('TIME') }),
    questionBaseSchema.extend({
        type: z.enum(questionTypes.slice(4, 7)),
        optionsConfig: optionsConfigSchema,
    }),
    questionBaseSchema.extend({
        type: z.enum(questionTypes.slice(7)),
        ratingConfig: ratingConfigSchema,
    }),
]);

const indexedQuestionBaseSchema = questionBaseSchema.extend({
    _id: zodObjectId,
    index: z.number().int().nonnegative(),
});

export const questionTypesWithIndexSchema = z.discriminatedUnion('type', [
    indexedQuestionBaseSchema.extend({ type: z.literal('TEXT') }),
    indexedQuestionBaseSchema.extend({ type: z.literal('PARAGRAPH') }),
    indexedQuestionBaseSchema.extend({ type: z.literal('DATE') }),
    indexedQuestionBaseSchema.extend({ type: z.literal('TIME') }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('CHOICE'),
        optionsConfig: optionsConfigSchema,
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('RADIO'),
        optionsConfig: optionsConfigSchema,
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('DROP_DOWN'),
        optionsConfig: optionsConfigSchema,
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('LINEAR_SCALE'),
        ratingConfig: ratingConfigSchema,
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('RATING'),
        ratingConfig: ratingConfigSchema,
    }),
]);

export { sectionActionEnum };
