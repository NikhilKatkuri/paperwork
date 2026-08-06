"use client";

import React, { useEffect, useRef, useState } from "react";

export default function HorizontalScrollList() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);

    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    );
  };

  useEffect(() => {
    updateScrollButtons();

    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <div className="rounded-md overflow-hidden">
      <div className="relative w-full group bg-slate-100 rounded-md ">

        {/* Left button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex items-center justify-center w-12 h-12 rounded-full bg-brand-depth text-on-brand-depth transition-opacity duration-200 focus:outline-none"
            aria-label="Scroll Left"
          >
            <span className="material-symbols-outlined text-3xl">
              chevron_left
            </span>
          </button>
        )}

        <div className="w-full flex p-4 rounded-md  bg-brand-light/20">
          <div
          ref={scrollContainerRef}
          className="w-full flex gap-4  overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="w-62 shrink-0 flex flex-col gap-3"
            >
              <button className="w-full h-48 bg-white active:rounded-xl transition-all ease-in-out duration-150 active:scale-95 rounded-md" />
              <p className="text-theme-on-surface/70 text-sm px-2">
                Use this Template
              </p>
            </div>
          ))}
        </div>
        </div>

        {/* Right button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex items-center justify-center w-12 h-12 rounded-full bg-brand-depth text-on-brand-depth transition-opacity duration-200 focus:outline-none"
            aria-label="Scroll Right"
          >
            <span className="material-symbols-outlined text-3xl">
              chevron_right
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
