import { z } from 'zod';
import { sectionActionEnum } from './schemas/forms.sections';
export const zodObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Database ID format');

export const getSectionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
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
                    sectionId: zodObjectId.optional(),
                })
                .optional(),
            onAnswer: z
                .array(
                    z.object({
                        questionId: zodObjectId,
                        value: z.string().min(1, 'Value is required'),
                        action: z.object({
                            actionType: z.enum(sectionActionEnum),
                            sectionId: zodObjectId.optional(),
                        }),
                    })
                )
                .optional(),
        }),
    }),
});

export const createSectionSchema = sectionSchema;
export const updateSectionSchema = sectionSchema.partial();
export const orderSectionSchema = z.object({
    params: z.object({
        formId: zodObjectId,
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
