"use client";

import { SolarAltArrowLeftBroken } from "@/icons/index";
import {  useRouter, useSearchParams } from "next/navigation";

const Navbar = () => { 
  const router = useRouter();
  const search = useSearchParams();
 
  const step = search.get("step") ? parseInt(search.get("step") as string) : 1;
  const hasBack = step > 1;

  return (
    <div className="flex items-center justify-between w-full">
      {hasBack ? (
        <button
          onClick={() => router.back()}
          type="button"
          className="text-sm font-medium text-theme-on-surface/70 transition-all ease-in-out duration-150 hover:bg-theme-surface-hover active:bg-theme-surface-hover scale-100 active:scale-95 p-3 rounded-full cursor-pointer hover:text-theme-on-surface"
        >
          <SolarAltArrowLeftBroken className="size-5" />
        </button>
      ) : (
        <div className="h-11 w-11" />
      )}

    
      <div className="h-11 w-11" />
    </div>
  );
};

export default Navbar;