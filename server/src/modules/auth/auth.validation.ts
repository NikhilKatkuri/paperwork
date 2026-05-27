import { z } from 'zod';

export const signInSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email('Invalid email format')
            .transform((value) => value.toLowerCase()),

        password: z.string().min(1, 'Password is required'),
    }),
});

export const signUpSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email('Invalid email format')
            .transform((value) => value.toLowerCase()),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters long'),
        fullName: z
            .string()
            .min(2, 'Full name must be at least 2 characters long')
            .max(100, 'Full name cannot exceed 100 characters'),
        avatarUrl: z.string().url('Invalid URL format').optional(),
        bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    }),
});
