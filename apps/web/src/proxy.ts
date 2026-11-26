import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isAuthPath, isExcludedPath, isProtectedPath } from './_paths';
import { publicOrigin } from './utils/requestOrigin';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

function getRefreshSecret(): Uint8Array | null {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) return null;
    return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Never gate static assets / Next internals.
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$/)
    ) {
        return NextResponse.next();
    }

    if (isExcludedPath(pathname)) {
        return NextResponse.next();
    }

    const isHomeRoute = pathname === '/';
    const isAuthRoute = isAuthPath(pathname);
    const isProtectedRoute = isProtectedPath(pathname);

    if (!isHomeRoute && !isAuthRoute && !isProtectedRoute) {
        return NextResponse.next();
    }

    let isAuthenticated = false;

    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const secret = getRefreshSecret();

    if (refreshToken && secret) {
        try {
            await jwtVerify(refreshToken, secret, { algorithms: ['HS256'] });
            isAuthenticated = true;
        } catch {
            isAuthenticated = false;
        }
    }

    if (isAuthenticated && (isHomeRoute || isAuthRoute)) {
        return NextResponse.redirect(new URL('/user', publicOrigin(req)));
    }

    if (!isAuthenticated && isProtectedRoute) {
        const redirectUrl = new URL('/auth/signin', publicOrigin(req));
        redirectUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/:path*'],
};
