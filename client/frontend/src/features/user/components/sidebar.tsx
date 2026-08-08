"use client";

import { cn } from "@/utils/cn";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  isHovered?: () => boolean;
}

function IconButton({ name, isHovered, ...props }: IconButtonProps) {
  const _isHovered = isHovered?.() ?? false;
  return (
    <div className="group flex flex-col items-center justify-center cursor-pointer">
      <button
        {...props}
        className={cn(
          "rounded-full h-10 w-16  flex items-center justify-center transition-colors duration-300 ease-out",
          _isHovered
            ? "bg-brand-light"
            : "group-hover:bg-theme-form-surface-hover",
          props?.className,
        )}
      >
        <span
          className={cn(
            "material-symbols-outlined text-theme-on-surface text-center transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            _isHovered
              ? "text-on-brand-light scale-110 material-filled"
              : "group-hover:text-theme-form-on-surface-hover group-hover:scale-110",
          )}
        >
          {name}
        </span>
      </button>

      <p className="text-[12px] text-center font-normal mt-0.5 text-theme-on-surface group-hover:font-medium group-hover:scale-[1.02] transition-all duration-200 ease-out">
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </p>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-[44rem]:fixed max-[44rem]:bottom-0 max-[44rem]:left-0 max-[44rem]:h-20 h-full w-24 bg-slate-100 max-[44rem]:w-full">
      <div className="w-full h-full bg-brand-light/30 min-[44rem]:gap-4 grid min-[44rem]:grid-cols-1 min-[44rem]:grid-rows-[66px_66px_1fr] items-center grid-cols-3  py-6 max-[44rem]:py-0">
        {children}
      </div>
    </div>
  );
}

function getHover(pathname: string, routerPath: string) {
  if (pathname.startsWith("/user/settings")) {
    return "settings";
  }
  if (pathname === "/user") {
    return "home";
  }
  return undefined;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Wrapper>
      <IconButton
        onClick={() => router.push("/user")}
        name="home"
        isHovered={() => getHover(pathname, "/user") === "home"}
      />
      <IconButton
        onClick={() => router.push("/user/settings")}
        name="settings"
        isHovered={() => getHover(pathname, "/user/settings") === "settings"}
      />

      <div className="group flex flex-col items-center justify-center  *:cursor-pointer *:**:transition-all *:**:ease-in-out *:**:duration-150 min-[44rem]:self-end">
        <button className="rounded-full h-10 w-16 max-[44rem]:group-hover:bg-brand-light  flex items-center justify-center">
          <div className="h-8 min-[44rem]:h-10 aspect-square rounded-full bg-brand"></div>
        </button>
        <p className="text-[12px] text-center font-normal mt-1/2 min-[44rem]:hidden group-hover:font-medium">
          Profile
        </p>
      </div>
    </Wrapper>
  );
}
