import { randomBytes } from 'node:crypto';

export const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{8}$/;

export function generateShareCode(): string {
    return randomBytes(6).toString('base64url');
}

export function isValidShareCode(code: unknown): code is string {
    return typeof code === 'string' && SHARE_CODE_PATTERN.test(code);
}

export function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 11000
    );
}
