"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  SolarAltArrowLeftBroken,
  SolarAltArrowRightBroken,
} from "@/icons/index";

const ROUTE_CONFIG: Record<string, { backTo?: string; forwardTo?: string }> = {
  "/auth/check-email": {
    forwardTo: "/auth/signup",
  },
  "/auth/signup": {
    backTo: "/auth/check-email",
  },
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const config = ROUTE_CONFIG[pathname] || ROUTE_CONFIG["/auth/check-email"];
  const currentRedirect = searchParams.get("redirect") || "";

  const navigateWithParam = (targetPath: string) => {
    const url = currentRedirect
      ? `${targetPath}?redirect=${encodeURIComponent(currentRedirect)}`
      : targetPath;
    router.push(url);
  };

  const canGoBack = !!config.backTo;
  const canGoForward = !!config.forwardTo;

  return (
    <div className="flex items-center justify-between w-full">
      {canGoBack ? (
        <button
          type="button"
          onClick={() => navigateWithParam(config.backTo!)}
          className="text-sm font-medium text-theme-on-surface/70 transition-all ease-in-out duration-150 hover:bg-theme-surface-hover active:bg-theme-surface-hover scale-100 active:scale-95 p-3 rounded-full cursor-pointer hover:text-theme-on-surface"
        >
          <SolarAltArrowLeftBroken className="size-5" />
        </button>
      ) : (
        <div className="w-11 h-11" />
      )}

      {canGoForward ? (
        <button
          type="button"
          onClick={() => navigateWithParam(config.forwardTo!)}
          className="text-sm font-medium text-theme-on-surface/70 transition-all ease-in-out duration-150 hover:bg-theme-surface-hover active:bg-theme-surface-hover scale-100 active:scale-95 p-3 rounded-full cursor-pointer hover:text-theme-on-surface"
        >
          <SolarAltArrowRightBroken className="size-5" />
        </button>
      ) : (
        <div className="w-11 h-11" />
      )}
    </div>
  );
};

export default Navbar;
