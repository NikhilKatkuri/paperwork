"use client";

import React from "react";

// import { useRouter } from "next/navigation";
// import { LayoutContent, LayoutContentMap } from "./constants/config";

function Wrapper({ children }: { children: React.ReactNode }) {
  // const router = useRouter();
  return (
    <div className="max-[44rem]:fixed max-[44rem]:bottom-0 max-[44rem]:left-0 max-[44rem]:h-16 h-full w-24 bg-slate-100 max-[44rem]:w-full">
      <div className="w-full h-full bg-brand-light/30 flex max-[44rem]:flex-row flex-col items-center max-[44rem]:justify-around justify-between py-6 max-[44rem]:py-0">
        {children}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <Wrapper>
      <React.Fragment>
        <div className=""></div>
        <div className="max-[44rem]:hidden flex flex-col items-center justify-end">
          <div className="h-10 aspect-square rounded-full bg-brand"></div>
        </div>
      </React.Fragment>
    </Wrapper>
  );
}
