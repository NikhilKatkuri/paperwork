import { z } from 'zod';

import {
    formDataSchema,
    zodObjectId,
} from './validator.common';

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
