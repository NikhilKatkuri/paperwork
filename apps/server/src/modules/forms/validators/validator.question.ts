import { z } from 'zod';
import { questionDataSchema, zodObjectId } from './validator.common';

export const getAllQuestionsSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
});

export const getQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
        questionId: zodObjectId,
    }),
});

export const createQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
    body: z.object({
        data: questionDataSchema,
    }),
});

export const bulkCreateQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
    body: z.object({
        data: z.array(questionDataSchema).min(1),
    }),
});

export const updateQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
        questionId: zodObjectId,
    }),
    body: z.object({
        data: questionDataSchema,
    }),
});

export const reorderQuestionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
        sectionId: zodObjectId,
    }),
    body: z.object({
        data: z.array(
            z.object({
                questionId: zodObjectId,
                index: z.number().int().nonnegative(),
            })
        ),
    }),
});
