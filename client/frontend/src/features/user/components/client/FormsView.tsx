"use client";

import { cn } from "@/utils/cn";
import Link from "next/link";

function FormsView({ viewAsRow }: { viewAsRow: boolean }) {
  if (viewAsRow) {
    return (
      <Link
        href={"/"}
        className={cn(
          "w-full *:text-sm  grid-cols-[1fr_0.5fr] grid md:grid-cols-2 items-center hover:bg-brand-light cursor-pointer transition-all ease-in-out duration-150 rounded-md h-14 px-4 border border-transparent",
        )}
      >
        <div className="grid grid-cols-[36px_1fr] items-center gap-4">
          <div className="h-7 w-7  aspect-square bg-brand-depth rounded-md flex items-center justify-center">
            <div className="material-symbols-outlined text-on-brand-depth">
              format_list_bulleted
            </div>
          </div>
          <p className="font-medium">Recent forms</p>
        </div>
        <div
          className={cn(
            "grid gap-4 items-center xl:justify-end max-[900px]:grid-cols-[1fr_36px]",
            "grid-cols-[1fr_32px] min-[900px]:grid-cols-[1fr_1fr_36px] xl:grid-cols-[1fr_1fr_160px]",
          )}
        >
          <div className="text-left">
            <p className="text-md">me</p>
          </div>
          <div className="max-[900px]:hidden">
            <p className="text-md">9:00 AM</p>
          </div>

          <div className="flex items-center justify-end">
            <button className="rounded-full transition-all ease-in-out duration-150 hover:bg-brand-light/60 flex items-center justify-center h-10  aspect-square">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={"/"}
      className={
        "w-full *:text-sm grid grid-row-[1fr_36px] gap-2 items-center hover:bg-brand-light cursor-pointer transition-all ease-in-out duration-150 rounded-md p-4 border border-theme-skeletion-surface"
      }
    >
      <div className="h-auto w-full flex flex-col gap-2">
        <div className="grid grid-cols-[36px_1fr_20px] h-8 items-center gap-1">
          <div className="h-7 w-7  aspect-square bg-brand-depth rounded-md flex items-center justify-center">
            <div className="material-symbols-outlined text-on-brand-depth">
              format_list_bulleted
            </div>
          </div>
          <p className="font-medium">Recent forms</p>
          <button className="rounded-full">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
        <div className="h-32 w-full rounded-md bg-gray-100"></div>
      </div>
      <div className={cn("grid items-center  ")}>
        <div className="">
          <p className="text-md">me</p>
        </div>

        <div className="">
          <p className="text-sm">9:00 AM</p>
        </div>
      </div>
    </Link>
  );
}

export default FormsView;
