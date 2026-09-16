import { z } from 'zod';

import {
    formDataSchema,
    questionTypesWithIndexSchema,
    sectionDataSchema,
    zodObjectId,
} from './validator.common';

const indexedSectionSchema = sectionDataSchema.extend({
    _id: zodObjectId,
});

export const bulkPutFormSchema = z.object({
    params: z.object({ formId: zodObjectId }),
    body: z.object({
        data: formDataSchema.extend({
            sections: z.array(indexedSectionSchema).optional(),
            questions: z.array(questionTypesWithIndexSchema).optional(),
        }),
    }),
});
