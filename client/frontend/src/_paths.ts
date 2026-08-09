export const AUTH_PATHS = [
    '/auth/signin',
    '/auth/signup',
    '/auth/check-email',
    '/auth/forgot-password',
];

export const PROTECTED_PATHS = ['/user'];

export const PARTIAL_AUTH_PATHS = [
    '/auth/2fa',
    '/user/2fa',
    '/user/verify-email',
];

export const EXCLUDED_PATHS = ['/auth/reset-password', ...PARTIAL_AUTH_PATHS];

export const isExcludedPath = (path: string) =>
    EXCLUDED_PATHS.some((p) => path.startsWith(p));

export const isAuthPath = (path: string) =>
    AUTH_PATHS.some((p) => path.startsWith(p));

export const isProtectedPath = (path: string) =>
    PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
