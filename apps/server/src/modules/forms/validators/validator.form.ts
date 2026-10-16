import { z } from 'zod';

import {
    formDataSchema,
    sectionDataSchema,
    zodObjectId,
    questionDataSchema,
} from './validator.common';

export { formSettingsSchema, zodObjectId } from './validator.common';
export { bulkPutFormSchema } from './validator.bulk';

export const formSchema = z.object({
    body: z.object({ data: formDataSchema }),
});

export const createRequestFormSchema = z.object({
    body: z.object({
        data: formDataSchema.extend({
            section: sectionDataSchema,
            questions: z.array(questionDataSchema).min(1),
        }),
    }),
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

export const searchFormsSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(120),
        limit: z.coerce.number().int().min(1).max(25).default(10),
    }),
});
