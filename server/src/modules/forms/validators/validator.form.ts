import { z } from 'zod';

import { formDataSchema, zodObjectId } from './validator.common';

export { formSettingsSchema, zodObjectId } from './validator.common';
export { bulkPutFormSchema } from './validator.bulk';

export const formSchema = z.object({
    body: z.object({ data: formDataSchema }),
});

export const putRequestFormSchema = z.object({
    params: z.object({ formId: zodObjectId }),
    body: formSchema.shape.body,
});

export const patchRequestFormSchema = z.object({
    params: z.object({ formId: zodObjectId }),
    body: z.object({ data: formDataSchema.partial() }),
});

export const getFormSchema = z.object({
    params: z.object({ formId: zodObjectId }),
});

/**
 * Query for the name search.
 *
 * `q` is length-capped before it reaches a `$regex`, and `limit` is bounded so
 * a caller cannot ask for the whole collection.
 */
export const searchFormsSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(120),
        limit: z.coerce.number().int().min(1).max(25).default(10),
    }),
});
