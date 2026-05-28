import { z } from 'zod';

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
