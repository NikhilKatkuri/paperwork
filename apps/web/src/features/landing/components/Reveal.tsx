'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    yOffset?: number;
}

export function Reveal({
    children,
    className,
    delay = 0,
    yOffset = 18,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;
        function handleReducedMotion() {
            if (prefersReduced) {
                setVisible(true);
                return;
            }
        }
        handleReducedMotion();

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                transitionDelay: `${delay}ms`,
                transform: visible
                    ? 'translate3d(0, 0, 0)'
                    : `translate3d(0, ${yOffset}px, 0)`,
            }}
            className={cn(
                'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]',
                visible ? 'opacity-100' : 'opacity-0',
                className
            )}
        >
            {children}
        </div>
    );
}
