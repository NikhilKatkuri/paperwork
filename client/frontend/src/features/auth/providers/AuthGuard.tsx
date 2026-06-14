"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProviders";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = [
  "signin",
  "signup",
  "check-email",
  "forgot-password",
];
const PROTECTED_PATHS = ["/user"];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.some((publicPath) => path.includes(publicPath));
}

function isProtectedPath(path: string) {
  return PROTECTED_PATHS.some((protectedPath) => path.includes(protectedPath));
}

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, initializing } = useAuth();
  const router = useRouter();
  const path = usePathname();

  const handleRouteChange = useCallback(() => {
    if (initializing) return;
    const isAuthenticated = !!accessToken;

    if (isAuthenticated && isPublicPath(path)) {
      router.replace("/user");
    } else if (!isAuthenticated && isProtectedPath(path)) {
      router.replace("/auth/check-email?redirect=/auth/signin");
    } else if (
      !isAuthenticated &&
      !isPublicPath(path) &&
      !isProtectedPath(path)
    ) {
      router.replace("/auth/check-email?redirect=/auth/signin");
    }
  }, [accessToken, initializing, path, router]);

  useEffect(() => {
    handleRouteChange();
  }, [handleRouteChange]);

  if (initializing) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
