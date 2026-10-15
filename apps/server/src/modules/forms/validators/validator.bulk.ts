import { z } from 'zod';

import {
    formDataSchema,
    optionSchema,
    questionTypesWithIndexSchema,
    sectionDataSchema,
    zodObjectId,
} from './validator.common';

/**
 * Draft sections may legitimately have a blank title while the editor is open,
 * so `min(1)` is relaxed here - otherwise clearing a title fails validation and
 * rejects every other change made in the same session.
 */
const indexedSectionSchema = sectionDataSchema
    .extend({ _id: zodObjectId })
    .extend({ title: z.string().max(255) });

/**
 * Relaxed rating config.
 *
 * The shared schema pins `scale` to 5 or 10, but the domain type allows 3-9 and
 * the Mongoose model accepts any positive integer. A client picking 7 would
 * otherwise fail validation and take the whole batch down with it.
 */
const draftRatingConfigSchema = z.object({
    icon: z.string().max(50),
    scale: z.number().int().min(1).max(10),
    lowLabel: z.string().max(50).optional(),
    highLabel: z.string().max(50).optional(),
});

/**
 * Questions arrive here already bound to a section. The shared
 * `questionTypesWithIndexSchema` has no `sectionId`, and zod strips unknown
 * keys - so without this the link would be silently dropped and every synced
 * question would be orphaned from its section.
 *
 * Draft fields are deliberately loosened: blank question text, an unconfigured
 * choice question or a missing rating config are all valid intermediate states
 * while the editor is open, and rejecting them would block syncing every other
 * change the user made in the session.
 */
const bulkQuestionSchema = z.discriminatedUnion(
    'type',
    questionTypesWithIndexSchema.options.map((schema) =>
        schema.extend({
            sectionId: zodObjectId,
            question: z.string().max(1000),
            optionsConfig: z
                .object({ options: z.array(optionSchema) })
                .optional(),
            ratingConfig: draftRatingConfigSchema.optional(),
        })
    ) as never
);

export const bulkPutFormSchema = z.object({
    params: z.object({ formId: zodObjectId }),
    body: z.object({
        data: formDataSchema.extend({
            sections: z.array(indexedSectionSchema).optional(),
            questions: z.array(bulkQuestionSchema).optional(),
        }),
    }),
});
