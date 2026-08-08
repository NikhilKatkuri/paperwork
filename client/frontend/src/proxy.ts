import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isAuthPath, isExcludedPath, isProtectedPath } from "./_paths";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!,
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const isAuthRoute = isAuthPath(pathname);
  const isProtectedRoute = isProtectedPath(pathname);

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
      isAuthenticated = false;
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
