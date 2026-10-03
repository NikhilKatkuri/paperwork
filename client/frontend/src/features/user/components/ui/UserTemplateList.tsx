'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function HorizontalScrollList() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        const el = scrollContainerRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 0);

        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        updateScrollButtons();

        const el = scrollContainerRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        return () => {
            el.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (!el) return;

        el.scrollBy({
            left: direction === 'left' ? -300 : 300,
            behavior: 'smooth',
        });
    };

    return (
        <div className="mb-4 overflow-hidden rounded-md">
            <div className="group relative w-full rounded-md bg-slate-100">
                {/* Left button */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="bg-theme-form-container-active text-on-brand-depth absolute top-1/2 left-2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-200 group-hover:flex focus:outline-none"
                        aria-label="Scroll Left"
                    >
                        <span className="material-symbols-outlined text-3xl">
                            chevron_left
                        </span>
                    </button>
                )}

                <div className="bg-brand-light/20 flex w-full rounded-md p-4">
                    <div
                        ref={scrollContainerRef}
                        className="flex w-full scrollbar-none gap-4 overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex w-62 shrink-0 flex-col gap-3"
                            >
                                <button className="h-48 w-full rounded-md bg-white transition-all duration-150 ease-in-out active:scale-95 active:rounded-xl">
                                    <span className="material-symbols-outlined">
                                        add
                                    </span>
                                </button>
                                <p className="text-theme-on-surface/70 px-2 text-sm">
                                    Use this Template
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right button */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="bg-theme-form-container-active text-on-brand-depth absolute top-1/2 right-2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-200 group-hover:flex focus:outline-none"
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
