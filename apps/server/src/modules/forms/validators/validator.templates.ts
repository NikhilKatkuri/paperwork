import { z } from 'zod';
import {
    formDataSchema,
    questionDataSchema,
    sectionDataSchema,
    zodObjectId,
} from './validator.common';

const templateSectionSchema = sectionDataSchema.extend({
    id: zodObjectId,
});

const templateQuestionSchema = questionDataSchema.and(
    z.object({ sectionId: zodObjectId })
);

export const createTemplateSchema = z
    .object({
        body: z.object({
            name: z.string().trim().min(1).max(200),
            description: z.string().max(1000).optional(),
            category: z.string().trim().min(1).max(100),
            isFeatured: z.boolean().optional().default(false),
            form: formDataSchema,
            sections: z.array(templateSectionSchema).min(1),
            questions: z.array(templateQuestionSchema),
        }),
    })
    .superRefine(({ body }, ctx) => {
        const sectionIds = new Set(body.sections.map((section) => section.id));

        body.questions.forEach((question, index) => {
            if (!sectionIds.has(question.sectionId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['body', 'questions', index, 'sectionId'],
                    message: 'Question references an unknown section',
                });
            }
        });
    });
