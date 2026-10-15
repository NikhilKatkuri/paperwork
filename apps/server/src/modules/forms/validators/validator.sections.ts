import { z } from 'zod';

import {
    sectionActionSchema,
    sectionDataSchema,
    zodObjectId,
} from './validator.common';

export { zodObjectId } from './validator.common';

export const getSectionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
});

export const sectionSchema = z.object({
    body: z.object({
        data: sectionDataSchema.extend({
            defaultAction: sectionActionSchema.optional(),
        }),
    }),
});

export const createSectionSchema = sectionSchema;
export const updateSectionSchema = z.object({
    body: z.object({
        data: sectionDataSchema.partial(),
    }),
});

export const orderSectionSchema = z.object({
    params: z.object({ formId: zodObjectId }),
    body: z.object({
        data: z.array(
            z.object({
                sectionId: zodObjectId,
                index: z.number().int().nonnegative(),
            })
        ),
    }),
});
