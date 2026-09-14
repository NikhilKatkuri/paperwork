import { z } from 'zod';

export const zodObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const formSettingsSchema = z
    .object({
        maxResponses: z.number().int().positive().nullable().optional(),
        maxResponsesPerUser: z.number().int().positive().default(1),

        closeDate: z.coerce.date().nullable().optional(),
        startDate: z.coerce.date().nullable().optional(),

        timeLimitPerResponse: z.number().int().positive().nullable().optional(),
        collectEmail: z.boolean().default(false),
        shuffleQuestions: z.boolean().default(false),
        allowEditResponse: z.boolean().default(false),
        saveAndContinueLater: z.boolean().default(false),
        progressBar: z.boolean().default(false),

        customConfirmationMessage: z
            .string()
            .max(1000, 'Message too long')
            .nullable()
            .optional(),
        redirectUrl: z
            .string()
            .url('Invalid redirect URL format')
            .nullable()
            .optional(),
    })
    .strict();

export const formSchema = z.object({
    body: z.object({
        data: z.object({
            name: z
                .string()
                .min(1, 'name is required')
                .max(255, 'name cannot exceed 255 characters'), 
            isPrivate: z.boolean().default(false),
            isPublished: z.boolean().default(false),
            allowedDomains: z.array(z.string()).optional(),
            settings: formSettingsSchema.optional(),
        }),
    }),
});

export const putRequestFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
    body: formSchema.shape.body,
});

export const patchRequestFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
    body: z.object({
        data: z.object({
            name: z
                .string()
                .min(1, 'name is required')
                .max(255, 'name cannot exceed 255 characters')
                .optional(),
            isPrivate: z.boolean().optional(),
            isPublished: z.boolean().optional(),
            allowedDomains: z.array(z.string()).optional(),
            settings: formSettingsSchema.optional(),
        }),
    }),
});

export const getFormSchema = z.object({
    params: z.object({
        formId: zodObjectId,
    }),
});
