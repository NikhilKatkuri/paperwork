import { z } from 'zod';

import {
    questionDataSchema,
    questionTypesWithIndexSchema,
    zodObjectId,
} from './validator.common';

export const getAllQuestionsSchema = z.object({
    params: z.object({ formId: zodObjectId, sectionId: zodObjectId }),
});

export const getQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
        questionId: zodObjectId,
    }),
});

export const questionSchema = questionDataSchema;

export const createQuestionSchema = z.object({
    body: z.object({ data: questionSchema }),
});

export const bulkCreateQuestionSchema = z.object({
    body: z.object({ data: z.array(questionSchema).min(1) }),
});

export const updateQuestionSchema = z.object({
    body: z.object({ data: questionSchema }),
});

export const reorderQuestionSchema = z.object({
    params: z.object({ formId: zodObjectId, sectionId: zodObjectId }),
    body: z.object({
        data: z.array(
            z.object({
                questionId: zodObjectId,
                index: z.number().int().nonnegative(),
            })
        ),
    }),
});

export { questionTypesWithIndexSchema };
export { fillFormSchema, postFormSchema } from './validator.fill';
