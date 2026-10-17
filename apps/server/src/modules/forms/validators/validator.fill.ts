import z from 'zod';
import { zodObjectId } from './validator.common';

export const fillFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
});

export const answerValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
]);

export const postFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
    body: z.object({
        idempotencyKey: z.string().min(1),
        email: z.email().optional(),
        answers: z
            .array(
                z.object({
                    questionId: zodObjectId,
                    questionSlug: z.string().optional(),
                    value: answerValueSchema,
                })
            )
            .min(1, 'At least one answer is required'),
        metadata: z.object({
            userAgent: z.string(),
            ipAddress: z.string(),
            browser: z.string().optional(),
            os: z.string().optional(),
            device: z.string().optional(),
            country: z.string().optional(),
            timeSpentSeconds: z.number().nonnegative().optional(),
        }),
        isCompleted: z.boolean().default(false),
        currentSectionId: zodObjectId.optional(),
    }),
});

export const responseIdSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        responseId: zodObjectId,
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

export const exportResponsesSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        exportType: z.enum(['csv']),
    }),
    query: z.object({
        q: z.string().trim().max(120).optional(),
        questionId: zodObjectId.optional(),
        sort: z.enum(['newest', 'oldest']).default('newest'),
    }),
});

export const submissionStatusSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        submissionId: z.string().min(1).max(64),
    }),
});

export const responsesQuerySchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        q: z.string().trim().max(120).optional(),
        questionId: zodObjectId.optional(),
        sort: z.enum(['newest', 'oldest']).default('newest'),
    }),
});
