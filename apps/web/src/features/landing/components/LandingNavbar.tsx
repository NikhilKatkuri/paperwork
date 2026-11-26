'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/providers';
import { cn } from '@/utils/cn';

const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Templates', href: '#use-cases' },
];

const focusClass =
    'focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

const primaryClass = cn(
    focusClass,
    'group bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
);

const secondaryClass = cn(
    focusClass,
    'border-theme-on-surface/15 hover:bg-theme-surface-hover hover:border-theme-on-surface/30 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200'
);

export function LandingNavbar() {
    const { decodedToken, initializing } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isSignedIn = !initializing && !!decodedToken;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 transition-all duration-300',
                scrolled
                    ? 'border-theme-on-surface/10 bg-theme-surface/85 border-b shadow-sm shadow-black/[0.03] backdrop-blur-xl'
                    : 'bg-theme-surface/60 border-b border-transparent backdrop-blur-md'
            )}
        >
            <a
                href="#content"
                className={cn(
                    focusClass,
                    'bg-brand-depth text-on-brand-depth sr-only rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50'
                )}
            >
                Skip to content
            </a>

            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
                <Link
                    href="/"
                    className={cn(
                        focusClass,
                        'group flex items-center gap-2.5'
                    )}
                >
                    <div className="relative flex h-8 w-8 items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        <Image
                            src="/paperwork_icon-vector-master.svg"
                            alt=""
                            width={30}
                            height={30}
                        />
                    </div>
                    <span className="text-base font-bold tracking-tight">
                        {siteConfig.name}
                    </span>
                </Link>

                <nav
                    aria-label="Main"
                    className="border-theme-on-surface/10 bg-theme-form-container/70 hidden rounded-full border px-2 py-1 md:block"
                >
                    <ul className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className={cn(
                                        focusClass,
                                        'text-theme-on-surface/70 hover:text-theme-on-surface hover:bg-theme-surface-hover block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors'
                                    )}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="hidden items-center gap-2.5 md:flex">
                    {isSignedIn ? (
                        <Link href="/user" className={primaryClass}>
                            Go to Dashboard
                            <span
                                className="material-symbols-outlined !text-base transition-transform duration-200 group-hover:translate-x-0.5"
                                aria-hidden
                            >
                                arrow_forward
                            </span>
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth" className={secondaryClass}>
                                Sign In
                            </Link>
                            <Link
                                href="/auth?mode=signup"
                                className={primaryClass}
                            >
                                Get Started
                                <span
                                    className="material-symbols-outlined !text-base transition-transform duration-200 group-hover:translate-x-0.5"
                                    aria-hidden
                                >
                                    arrow_forward
                                </span>
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="landing-mobile-menu"
                    onClick={() => setMenuOpen((open) => !open)}
                    className={cn(
                        focusClass,
                        'border-theme-on-surface/15 hover:bg-theme-surface-hover flex h-10 w-10 items-center justify-center rounded-full border transition-colors md:hidden'
                    )}
                >
                    <span
                        className="material-symbols-outlined text-xl transition-transform duration-200"
                        aria-hidden
                    >
                        {menuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {menuOpen && (
                <nav
                    id="landing-mobile-menu"
                    aria-label="Mobile"
                    className="border-theme-on-surface/10 bg-theme-surface border-t px-4 py-4 shadow-lg md:hidden"
                >
                    <ul className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(
                                        focusClass,
                                        'hover:bg-theme-surface-hover block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
                                    )}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex flex-col gap-2">
                        {isSignedIn ? (
                            <Link
                                href="/user"
                                onClick={() => setMenuOpen(false)}
                                className={cn(primaryClass, 'w-full')}
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/auth"
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(
                                        secondaryClass,
                                        'w-full text-center'
                                    )}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth?mode=signup"
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(primaryClass, 'w-full')}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}
