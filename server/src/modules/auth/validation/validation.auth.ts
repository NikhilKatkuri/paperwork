import { z } from 'zod';
import { COUNTRIES, GENDERS, LANGUAGES } from '../constants/enums';

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
    }),
});

export const validateEmailSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email('Invalid email format')
            .transform((value) => value.toLowerCase()),
    }),
});

export const accountActionsSchema = z.object({
    body: z.object({
        action: z.enum(
            [
                'delete-account',
                'enable-2fa',
                'disable-2fa',
                'deactivate-account',
            ],
            {
                message: 'Invalid API',
            }
        ),
        password: z.string().min(1, 'Invalid API'),
    }),
});

export const SecuritySettingsSchema = z.object({
    body: z.object({
        dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'Invalid date format',
        }),
        gender: z.enum(Object.values(GENDERS), {
            message: 'Invalid gender value',
        }),
        country: z.enum(Object.values(COUNTRIES), {
            message: 'Invalid country value',
        }),
        language: z.enum(Object.values(LANGUAGES), {
            message: 'Invalid language value',
        }),
    }),
});

export const UpdateSecuritySettingsSchema = z.object({
    body: SecuritySettingsSchema.shape.body.partial(),
});

export const profileUpdateSchema = z.object({
    body: z.object({
        fullName: z
            .string()
            .min(2, 'Full name must be at least 2 characters long')
            .max(100, 'Full name cannot exceed 100 characters'),
        bio: z.string().max(500, 'Bio cannot exceed 500 characters'),
        avatarUrl: z.string().url('Invalid URL format'),
    }),
});
