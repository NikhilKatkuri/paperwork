"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthProviders";
import { usePathname, useRouter } from "next/navigation";
import { EXCLUDED_PATHS, PROTECTED_PATHS, AUTH_PATHS } from "@/_paths";

const isProtectedPath = (path: string) =>
  PROTECTED_PATHS.some((p) => path.startsWith(p));

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, initializing } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (initializing) return;

    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) return;

    const isAuthenticated = Boolean(accessToken);

    const isLoginOrSignup = AUTH_PATHS.some((p) => path.startsWith(p));

    if (isAuthenticated && isLoginOrSignup) {
      router.replace("/user/profile");
      return;
    }

    if (!isAuthenticated && isProtectedPath(path)) {
      router.replace("/auth/signin?step=1");
      return;
    }
  }, [accessToken, initializing, path, router]);

  if (initializing) {
    return <div className="">loading</div>;
  }

  return <>{children}</>;
};
