"use client";

import { cn } from "@/utils/cn";
import { SidebarIntent } from "../../constants/config";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const currentRoute = usePathname();
  return (
    <div className="h-full *:text-theme-on-surface/80  shadow-[12px_12px_53px_0px_rgba(71,85,105,0.08)] w-full md:w-72 md:max-w-72 p-4  rounded-2xl flex flex-col gap-2">
      <h1 className="w-full p-2 font-medium">Settings</h1>
      <div className="grid grid-cols-1 gap-2 *:text-sm">
        {SidebarIntent.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              router.push(item.route);
            }}
            className="w-full"
          >
            <div
              className={cn(
                "w-full p-2  transition-colors bg-transparent  ease-in-out duration-200 grid grid-cols-[24px_1fr] items-center gap-4 rounded-lg cursor-pointer",
                currentRoute.startsWith(item.route)
                  ? "bg-brand-light/50 text-brand-depth"
                  : "hover:bg-brand-light/50 hover:text-brand-depth",
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p className="text-left">{item.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
