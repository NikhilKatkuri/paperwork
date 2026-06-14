"use client";

import {
  SolarAltArrowLeftBroken,
  SolarAltArrowRightBroken,
} from "@/icons/index";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        className="text-sm font-medium text-theme-on-surface/70 transition-all ease-in-out duration-150 hover:bg-theme-surface-hover active:bg-theme-surface-hover scale-100 active:scale-95 p-3 rounded-full cursor-pointer hover:text-theme-on-surface"
      >
        <SolarAltArrowLeftBroken className="size-5" />
      </button>

      <button
        type="button"
        className="text-sm font-medium text-theme-on-surface/70 transition-all ease-in-out duration-150 hover:bg-theme-surface-hover active:bg-theme-surface-hover scale-100 active:scale-95 p-3 rounded-full cursor-pointer hover:text-theme-on-surface"
      >
        <SolarAltArrowRightBroken className="size-5" />
      </button>
    </div>
  );
};

export default Navbar;
