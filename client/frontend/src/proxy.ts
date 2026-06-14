import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const AUTH_PATHS = ["signin", "signup"];
const EXCLUD_PATHS = ["reset-password"];
const PROTECTED_PATHS = ["user"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (EXCLUD_PATHS.some((path) => pathname.includes(path))) {
    return NextResponse.next();
  }
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let isValid = false;
  if (refreshToken) {
    try {
      jwt.verify(refreshToken, process.env.NEXT_PUBLIC_JWT_REFRESH_SECRET!);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.includes(path));
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.includes(path),
  );

  if (isValid && isAuthPath) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  if (!isValid && isProtectedPath) {
    return NextResponse.redirect(new URL("/auth/signin?step=1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user", "/auth/signin", "/auth/signup", "/auth/reset-password"],
};
