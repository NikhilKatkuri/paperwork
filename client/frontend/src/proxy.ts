import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_PATHS, EXCLUDED_PATHS, PROTECTED_PATHS } from "./_paths";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_REFRESH_SECRET!,
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
 
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (!isAuthRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  let isAuthenticated = false;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await jwtVerify(refreshToken, REFRESH_SECRET);
      isAuthenticated = true;
    } catch {
      // Invalid or expired refresh token
    }
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL("/auth/signin", req.url);
    redirectUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(redirectUrl);
  }

 }

export const config = {
  matcher: ["/:path*"],
};