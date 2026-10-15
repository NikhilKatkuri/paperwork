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

/**
 * Query for the paginated response list.
 *
 * `limit` is bounded here so a caller cannot ask for an unbounded page, and
 * `q` is length-capped before it reaches a `$regex`.
 */
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
