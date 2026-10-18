import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';
import { siteConfig } from '@/config/site';

export interface TocItem {
    id: string;
    label: string;
}

const headerLinks = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Help', href: '/help' },
    { label: 'Contact', href: '/contact' },
];

const navLinkClass =
    'rounded-md text-sm text-theme-on-surface/70 transition-colors hover:text-theme-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

/**
 * Shared shell for the public information pages (privacy, terms, help,
 * contact): brand header, readable text column, optional table of contents
 * and the shared footer. Public by default — `src/proxy.ts` only guards the
 * `/user` and `/forms` prefixes.
 */
export default function InfoPageShell({
    title,
    intro,
    toc,
    showUpdated = true,
    children,
}: {
    title: string;
    intro?: ReactNode;
    toc?: TocItem[];
    showUpdated?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="bg-theme-surface text-theme-on-surface flex min-h-dvh flex-col">
            <a
                href="#content"
                className="bg-brand-depth text-on-brand-depth sr-only rounded-md px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
            >
                Skip to content
            </a>
            <header className="border-theme-on-surface/10 border-b">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <Link
                        href="/"
                        className="focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <Image
                            src="/paperwork_icon-vector-master.svg"
                            alt=""
                            width={28}
                            height={28}
                        />
                        <span className="text-base font-semibold">
                            {siteConfig.name}
                        </span>
                    </Link>
                    <nav
                        aria-label="Information pages"
                        className="hidden md:block"
                    >
                        <ul className="flex items-center gap-5">
                            {headerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={navLinkClass}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </header>

            <main
                id="content"
                className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6"
            >
                <div className="max-w-3xl">
                    <h1 className="text-2xl font-semibold sm:text-3xl">
                        {title}
                    </h1>
                    {intro && (
                        <p className="text-theme-on-surface/70 mt-3 text-base leading-relaxed">
                            {intro}
                        </p>
                    )}
                    {showUpdated && (
                        <p className="text-theme-on-surface/60 mt-3 text-xs">
                            Last updated: {siteConfig.lastUpdated}
                        </p>
                    )}
                    {toc && toc.length > 0 && (
                        <nav
                            aria-label="On this page"
                            className="border-theme-on-surface/10 mt-6 rounded-2xl border p-4"
                        >
                            <p className="text-theme-on-surface/60 text-xs font-semibold tracking-wide uppercase">
                                On this page
                            </p>
                            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                                {toc.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            href={`#${item.id}`}
                                            className="text-theme-on-surface/70 hover:text-theme-on-surface focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>

                <div className="mt-10 max-w-3xl space-y-10">{children}</div>
            </main>

            <SiteFooter />
        </div>
    );
}
