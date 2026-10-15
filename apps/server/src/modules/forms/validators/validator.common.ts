import { z } from 'zod';
import {
    fieldValidationRuleEnum,
    ratingIconEnum,
} from '../schemas/schemas.questions';
import { FORM_THEMES } from '@paperwork/types';

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
        redirectUrl: z.string().nullable().optional(),
    })
    .strict();

export const formDataSchema = z
    .object({
        name: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        accessCode: z.string().max(100).optional(),
        isPrivate: z.boolean().default(false),
        isPublished: z.boolean().default(false),
        allowedDomains: z.array(z.string()).optional(),
        settings: formSettingsSchema.optional(),
        responseCount: z.number().int().nonnegative().optional(),
        theme: z.enum(FORM_THEMES).optional(),
    })
    .strict();

export const sectionActionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('NEXT_SECTION') }),
    z.object({ type: z.literal('SUBMIT_FORM') }),
    z.object({
        type: z.literal('GO_TO_SECTION'),
        targetSectionId: zodObjectId,
    }),
]);

export const SectionRules = z.object({
    questionId: zodObjectId,
    operator: z.enum([
        'EQUALS',
        'NOT_EQUALS',
        'CONTAINS',
        'GREATER_THAN',
        'LESS_THAN',
    ]),
    expectedValue: z.union([z.string(), z.number(), z.boolean()]),
    action: sectionActionSchema,
});

export const sectionDataSchema = z
    .object({
        index: z.number().int().nonnegative(),
        title: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        defaultAction: sectionActionSchema.optional(),
        rules: z.array(SectionRules).optional(),
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

export const matrixRowSchema = z.object({
    id: z.string(),
    label: z.string(),
});

export const matrixColumnSchema = z.object({
    id: z.string(),
    label: z.string(),
});

export const matrixConfigSchema = z.object({
    rows: z.array(matrixRowSchema),
    columns: z.array(matrixColumnSchema),
    allowMultiplePerColumn: z.boolean().optional(),
});

export const ratingConfigSchema = z.object({
    icon: z.enum(ratingIconEnum),
    scale: z.union([
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
        z.literal(8),
        z.literal(9),
    ]),
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

export const QuestionBaseSchema = z.object({
    slug: z.string().min(1),
    index: z.number().int().nonnegative(),
    question: z.string().min(1).max(1000),
    helpText: z.string().max(500).optional(),
    dependsOn: dependsOnSchema.optional(),
    validationRule: validationRuleSchema.optional(),
    placeholder: z.string().max(100).optional(),
    isRequired: z.boolean().default(false),
    correctAnswer: z
        .union([
            z.string(),
            z.number(),
            z.array(z.number()),
            z.record(z.string(), z.string()),
        ])
        .optional(),
});

export const questionDataSchema = z.discriminatedUnion('type', [
    QuestionBaseSchema.extend({
        type: z.enum(['TEXT', 'PARAGRAPH', 'DATE', 'TIME']),
        options: z.undefined(),
        ratingConfig: z.undefined(),
        matrixConfig: z.undefined(),
    }),
    QuestionBaseSchema.extend({
        type: z.enum(['CHOICE', 'RADIO', 'DROP_DOWN']),
        options: z.array(optionSchema).min(1),
        correctAnswer: z.union([z.number(), z.array(z.number())]).optional(),
        ratingConfig: z.undefined(),
        matrixConfig: z.undefined(),
    }),
    QuestionBaseSchema.extend({
        type: z.enum(['LINEAR_SCALE', 'RATING']),
        options: z.undefined(),
        ratingConfig: ratingConfigSchema,
        matrixConfig: z.undefined(),
    }),
    QuestionBaseSchema.extend({
        type: z.literal('MATRIX'),
        options: z.undefined(),
        ratingConfig: z.undefined(),
        matrixConfig: matrixConfigSchema,
    }),
]);
const indexedQuestionBaseSchema = QuestionBaseSchema.extend({
    _id: zodObjectId,
    index: z.number().int().nonnegative(),
});

export const questionTypesWithIndexSchema = z.discriminatedUnion('type', [
    indexedQuestionBaseSchema.extend({
        type: z.enum(['TEXT', 'PARAGRAPH', 'DATE', 'TIME']),
        options: z.undefined(),
        ratingConfig: z.undefined(),
        matrixConfig: z.undefined(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.enum(['CHOICE', 'RADIO', 'DROP_DOWN']),
        options: z.array(optionSchema).min(1),
        correctAnswer: z.union([z.number(), z.array(z.number())]).optional(),
        ratingConfig: z.undefined(),
        matrixConfig: z.undefined(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.enum(['LINEAR_SCALE', 'RATING']),
        options: z.undefined(),
        ratingConfig: ratingConfigSchema,
        matrixConfig: z.undefined(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('MATRIX'),
        options: z.undefined(),
        ratingConfig: z.undefined(),
        matrixConfig: matrixConfigSchema,
    }),
]);
