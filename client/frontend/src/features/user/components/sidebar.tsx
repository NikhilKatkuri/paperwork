"use client"; 
import { useRouter } from "next/navigation";
import { LayoutContent, LayoutContentMap } from "./constants/config";

export default function Sidebar() {
  const router = useRouter();
  return (
    <aside className="max-md:hidden h-full w-full border-r bg-theme-surface border-theme-on-surface/10 p-4">
      {LayoutContent.map((item) => {
        return (
          <button
            key={item}
            onClick={()=>{
              router.push(LayoutContentMap[item] as string);
            }}
            className="h-12 bg-transparent w-full text-theme-on-surface transition-all ease-in-out duration-200 hover:bg-brand-light rounded-md px-3 cursor-pointer text-left"
          >
            {item.replaceAll("_", " ")}
          </button>
        );
      })}
    </aside>
  );
}
