import z from 'zod';
import { zodObjectId } from './validator.common';

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

export const responseIdSchema = z.object({
    params: z.object({
        responseId: zodObjectId,
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});
