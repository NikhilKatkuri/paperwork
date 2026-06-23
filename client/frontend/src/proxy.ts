import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_PATHS, EXCLUDED_PATHS, PROTECTED_PATHS } from "./_paths";

const REFRESH_TOKEN_COOKIE = "refreshToken";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return;
  }

  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let isValid = false;
  if (refreshToken) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXT_PUBLIC_JWT_RESET_PASSWORD_SECRET!,
      );
      await jwtVerify(refreshToken, secret);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (isValid && isAuthPath) {
    return NextResponse.redirect(new URL("/user/profile", req.url));
  }

  if (!isValid && isProtectedPath) {
    return NextResponse.redirect(new URL("/auth/signin?step=1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/:path*",
    "/auth/signin",
    "/auth/signup",
    "/auth/reset-password",
    "/auth/signin/2fa",
    "/",
  ],
};
