export const PUBLIC_FILL_PREFIX = '/forms/v';

export const AUTH_PATHS = [
    '/auth/signin',
    '/auth/signup',
    '/auth/check-email',
    '/auth/forgot-password',
];

export const PROTECTED_PATHS = ['/user', '/forms'];

export const PARTIAL_AUTH_PATHS = [
    '/auth/signin/2fa',
    '/auth/2fa',
    '/user/2fa',
    '/user/verify-email',
];

export const EXCLUDED_PATHS = ['/auth/reset-password', ...PARTIAL_AUTH_PATHS];

const hasSegmentBoundary = (path: string, prefix: string) =>
    path === prefix ||
    path.startsWith(`${prefix}/`) ||
    path.startsWith(`${prefix}?`);

export const isExcludedPath = (path: string) =>
    EXCLUDED_PATHS.some((p) => hasSegmentBoundary(path, p));

export const isAuthPath = (path: string) =>
    AUTH_PATHS.some((p) => hasSegmentBoundary(path, p));

export const isPublicFillPath = (path: string) =>
    hasSegmentBoundary(path, PUBLIC_FILL_PREFIX);

export const isProtectedPath = (path: string) => {
    if (isPublicFillPath(path)) return false;
    return PROTECTED_PATHS.some(
        (p) => path === p || path.startsWith(`${p}/`)
    );
};
