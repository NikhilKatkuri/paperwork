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
        redirectUrl: z
            .string()
            .max(2048)
            .refine((v) => !v || /^https?:\/\//.test(v), {
                message: 'redirectUrl must start with http:// or https://',
            })
            .nullable()
            .optional(),
    })
    // NOTE: intentionally not `.strict()`. Unknown keys are stripped, not
    // rejected: a hard 400 on unrecognized keys turns every client/server
    // version skew into a total outage ("Unrecognized keys" on sync/create).
    // Forgery protection lives in `fieldsValidator` (allow-list) plus the
    // service layer, which forces server-owned fields explicitly.
    .refine(
        (s) => !s.startDate || !s.closeDate || s.startDate < s.closeDate,
        { message: 'startDate must be before closeDate', path: ['startDate'] }
    );

export const formDataSchema = z
    .object({
        name: z.string().trim().min(1).max(255),
        isPrivate: z.boolean().default(false),
        allowedDomains: z
            .array(
                z
                    .string()
                    .trim()
                    .min(1)
                    .max(253)
                    .refine((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d), {
                        message: 'Invalid domain',
                    })
            )
            .max(20)
            .optional(),
        settings: formSettingsSchema.optional(),
        theme: z.enum(FORM_THEMES).optional(),
    });

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
    action: sectionActionSchema.optional(),
});

// Added optionsConfig schema to mirror your client-side updates
export const optionsConfigSchema = z.object({
    options: z.array(optionSchema).min(1),
    expectedAnswer: z.union([z.number(), z.array(z.number())]).optional(),
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

// Added scaleConfigSchema to match LinearScaleQuestion
export const scaleConfigSchema = z.object({
    lowerBound: z.number(),
    upperBound: z.number(),
    lowerLabel: z.string().max(50).optional(),
    upperLabel: z.string().max(50).optional(),
});

export const validationRuleSchema = z
    .object({
        ruleType: z.enum(fieldValidationRuleEnum),
        value: z.union([z.string(), z.number()]).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().max(200).optional(),
        customErrorMessage: z.string().max(200).optional(),
    })
    .superRefine((rule, ctx) => {
        if (
            (rule.ruleType === 'NUMBER_BETWEEN' ||
                rule.ruleType === 'CHECKBOX_MIN_SELECT' ||
                rule.ruleType === 'CHECKBOX_MAX_SELECT') &&
            (rule.min === undefined && rule.max === undefined && rule.value === undefined)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${rule.ruleType} requires min, max or value`,
            });
        }
        if (
            rule.ruleType === 'REGEX_MATCH' &&
            !rule.pattern
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'REGEX_MATCH requires pattern',
            });
        }
        if (
            (rule.ruleType === 'MIN_CHAR_COUNT' ||
                rule.ruleType === 'MAX_CHAR_COUNT') &&
            rule.value === undefined
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${rule.ruleType} requires value`,
            });
        }
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
    optionsConfig: optionsConfigSchema.optional(),
    ratingConfig: ratingConfigSchema.optional(),
    scaleConfig: scaleConfigSchema.optional(),
    matrixConfig: matrixConfigSchema.optional(),
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
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }),
    QuestionBaseSchema.extend({
        type: z.enum(['CHOICE', 'RADIO', 'DROP_DOWN']),
        options: z.array(optionSchema).min(1).optional(),
        correctAnswer: z.union([z.number(), z.array(z.number())]).optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }).superRefine((q, ctx) => {
        const hasOptions =
            (Array.isArray((q as any).options) && (q as any).options.length > 0) ||
            ((q as any).optionsConfig?.options?.length > 0);
        if (!hasOptions) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Choice questions require at least one option',
            });
        }
    }),
    QuestionBaseSchema.extend({
        type: z.literal('LINEAR_SCALE'),
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: scaleConfigSchema,
        matrixConfig: z.undefined().optional(),
    }),
    QuestionBaseSchema.extend({
        type: z.literal('RATING'),
        options: z.undefined().optional(),
        ratingConfig: ratingConfigSchema,
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }),
    QuestionBaseSchema.extend({
        type: z.literal('MATRIX'),
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
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
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.enum(['CHOICE', 'RADIO', 'DROP_DOWN']),
        options: z.array(optionSchema).min(1).optional(),
        correctAnswer: z.union([z.number(), z.array(z.number())]).optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }).superRefine((q, ctx) => {
        const hasOptions =
            (Array.isArray((q as any).options) && (q as any).options.length > 0) ||
            ((q as any).optionsConfig?.options?.length > 0);
        if (!hasOptions) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Choice questions require at least one option',
            });
        }
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('LINEAR_SCALE'),
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: scaleConfigSchema,
        matrixConfig: z.undefined().optional(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('RATING'),
        options: z.undefined().optional(),
        ratingConfig: ratingConfigSchema,
        scaleConfig: z.undefined().optional(),
        matrixConfig: z.undefined().optional(),
    }),
    indexedQuestionBaseSchema.extend({
        type: z.literal('MATRIX'),
        options: z.undefined().optional(),
        ratingConfig: z.undefined().optional(),
        scaleConfig: z.undefined().optional(),
        matrixConfig: matrixConfigSchema,
    }),
]);
