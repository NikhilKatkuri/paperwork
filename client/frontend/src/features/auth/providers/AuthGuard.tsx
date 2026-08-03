"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthProviders";
import { usePathname, useRouter } from "next/navigation";
import { EXCLUDED_PATHS, PROTECTED_PATHS, AUTH_PATHS } from "@/_paths";

const isAuthPath = (path: string) => AUTH_PATHS.some((p) => path.startsWith(p));
const isProtectedPath = (path: string) => PROTECTED_PATHS.some((p) => path.startsWith(p));

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, initializing } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (initializing) return;

    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) return;

    const isAuthenticated = !!accessToken;

    if (isAuthenticated && isAuthPath(path)) {
      router.replace("/user");
      return;
    }

    if (!isAuthenticated && isProtectedPath(path)) {
      router.replace("/auth/signin?step=1");
      return;
    }
  }, [accessToken, initializing, path, router]);
 
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  return <>{children}</>;
};