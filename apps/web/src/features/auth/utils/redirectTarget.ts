export function resolveRedirectTarget(
    from: string | null | undefined,
    fallback = '/user'
): string {
    if (!from || !from.startsWith('/') || from.startsWith('//')) {
        return fallback;
    }
    return from;
}
