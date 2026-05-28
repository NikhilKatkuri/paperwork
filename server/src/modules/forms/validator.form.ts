import { z } from 'zod';
import { sectionActionEnum } from './schemas/forms.sections';
import { questionEnum, ratingIconEnum } from './schemas/forms.questions';

export const zodObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Database ID format');

export const formSchema = z.object({
    data: z.object({
        title: z
            .string()
            .min(1, 'Title is required')
            .max(255, 'Title cannot exceed 255 characters'),
        description: z.string().min(1, 'Description is required').optional(),

        isPrivate: z.boolean().default(false),
        isPublished: z.boolean().default(false),
        allowedDomains: z
            .array(
                z
                    .string()
                    .regex(
                        /^[^\s@]+\.[^\s@]+$/,
                        'Each allowed domain must be a valid domain format'
                    )
            )
            .optional(),
    }),
});

export const getFormSchema = z.object({
    params: z.object({
        id: zodObjectId,
    }),
});

export const getSectionSchema = z.object({
    params: z.object({
        id: zodObjectId,
        sectionId: zodObjectId,
    }),
});

export const sectionSchema = z.object({
    body: z.object({
        data: z.object({
            index: z.number().min(0, 'Index must be a non-negative integer'),
            title: z
                .string()
                .min(1, 'Title is required')
                .max(255, 'Title cannot exceed 255 characters'),
            description: z.string().optional(),
            defaultAction: z
                .object({
                    actionType: z.enum(sectionActionEnum),
                    sectionIndex: z.number().min(0).optional(),
                })
                .optional(),
            onAnswer: z.array(
                z.object({
                    questionIndex: z
                        .number()
                        .min(
                            0,
                            'Question index must be a non-negative integer'
                        ),
                    value: z.string().min(1, 'Value is required'),
                    action: z.object({
                        actionType: z.enum(sectionActionEnum),
                        sectionIndex: z.number().min(0).optional(),
                    }),
                })
            ),
        }),
    }),
});

export const createSectionSchema = z.object({
    body: z.object({
        data: z.object({
            index: z
                .number()
                .min(0, 'Index must be a non-negative integer')
                .optional(),
            title: z
                .string()
                .min(1, 'Title is required')
                .max(255, 'Title cannot exceed 255 characters'),
            description: z.string().optional(),
            defaultAction: z
                .object({
                    actionType: z.enum(sectionActionEnum),
                    sectionIndex: z.number().min(0).optional(),
                })
                .optional(),
            onAnswer: z
                .array(
                    z.object({
                        questionIndex: z
                            .number()
                            .min(
                                0,
                                'Question index must be a non-negative integer'
                            ),
                        value: z.string().min(1, 'Value is required'),
                        action: z.object({
                            actionType: z.enum(sectionActionEnum),
                            sectionIndex: z.number().min(0).optional(),
                        }),
                    })
                )
                .optional(),
        }),
    }),
});

export const orderSectionSchema = z.object({
    params: z.object({
        id: zodObjectId,
    }),
    body: z.object({
        data: z.array(
            z.object({
                sectionId: zodObjectId,
                index: z
                    .number()
                    .min(0, 'Index must be a non-negative integer'),
            })
        ),
    }),
});

export const getAllQuestionsSchema = z.object({
    params: z.object({
        id: zodObjectId,
        sectionId: zodObjectId,
    }),
});

export const getQuestionSchema = z.object({
    params: z.object({
        id: zodObjectId,
        sectionId: zodObjectId,
        questionId: zodObjectId,
    }),
});

const dependsOnSchema = z.object({
    questionId: z.string().min(1),
    value: z.string().min(1),
});

const optionSchema = z.object({
    index: z.number().int().nonnegative(),
    value: z.string().min(1),
});

const ratingConfigSchema = z.object({
    scale: z.union([z.literal(5), z.literal(10)]),
    icon: z.enum(ratingIconEnum),
});

export const questionSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('TEXT'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
    }),
    z.object({
        type: z.literal('PARAGRAPH'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
    }),
    z.object({
        type: z.literal('DATE'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
    }),
    z.object({
        type: z.literal('TIME'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
    }),
    z.object({
        type: z.literal('CHOICE'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
        options: z.array(optionSchema).min(1),
    }),
    z.object({
        type: z.literal('RADIO'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
        options: z.array(optionSchema).min(1),
    }),
    z.object({
        type: z.literal('DROP_DOWN'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
        options: z.array(optionSchema).min(1),
    }),
    z.object({
        type: z.literal('LINEAR_SCALE'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
    }),
    z.object({
        type: z.literal('RATING'),
        question: z.string().min(1),
        dependsOn: dependsOnSchema.optional(),
        ratingConfig: ratingConfigSchema,
    }),
]);

export const createQuestionSchema = z.object({
    body: z.object({
        data: questionSchema,
    }),
});

export const updateQuestionSchema = z.object({
    body: z.object({
        data: questionSchema,
    }),
});

export const reorderQuestionSchema = z.object({
    params: z.object({
        id: zodObjectId,
        sectionId: zodObjectId,
    }),
    body: z.object({
        data: z.array(
            z.object({
                sectionId: zodObjectId,
                index: z
                    .number()
                    .min(0, 'Index must be a non-negative integer'),
            })
        ),
    }),
});
