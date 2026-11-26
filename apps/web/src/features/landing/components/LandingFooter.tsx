import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

const linkClass =
    'text-theme-on-surface/65 hover:text-theme-on-surface text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

const columns = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Use cases', href: '#use-cases' },
            { label: 'Templates', href: '/forms/templates' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Help center', href: '/help' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ],
    },
    {
        title: 'Account',
        links: [
            { label: 'Sign in', href: '/auth' },
            { label: 'Get started', href: '/auth?mode=signup' },
        ],
    },
];

export function LandingFooter() {
    return (
        <footer className="border-theme-on-surface/10 border-t">
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <Image
                                src="/paperwork_icon-vector-master.svg"
                                alt=""
                                width={26}
                                height={26}
                            />
                            <span className="font-semibold tracking-tight">
                                {siteConfig.name}
                            </span>
                        </Link>
                        <p className="text-theme-on-surface/60 mt-3 max-w-xs text-sm leading-relaxed">
                            Open-source form builder and response collection.
                        </p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <h3 className="text-sm font-semibold">
                                {column.title}
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className={linkClass}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-theme-on-surface/10 text-theme-on-surface/55 mt-12 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        {siteConfig.name} · {siteConfig.declaredLicense} licensed
                    </p>
                    <a
                        href={siteConfig.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                    >
                        Source on GitHub
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
