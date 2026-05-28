import { z } from 'zod';
import { sectionActionEnum } from './schemas/forms.sections';

export const zodObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Database ID format');

export const formSchema = z.object({
    body: z.object({
        data: z.object({
            title: z
                .string()
                .min(1, 'Title is required')
                .max(255, 'Title cannot exceed 255 characters'),
            description: z
                .string()
                .min(1, 'Description is required')
                .optional(),

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
    params: getFormSchema.shape.params,
    body: z.object({
        ...sectionSchema.shape,
    }),
});

export const orderSectionSchema = z.object({
    params: getFormSchema.shape.params,
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
