import Link from 'next/link';
import { siteConfig } from '@/config/site';

const footerLinks = [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Help', href: '/help' },
    { label: 'Contact', href: '/contact' },
];

const linkClass =
    'rounded-md text-sm text-theme-on-surface/70 transition-colors hover:text-theme-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

/**
 * Shared footer for the public information pages. Deliberately not mounted in
 * the authenticated dashboard shell, which manages its own full-height layout.
 */
export default function SiteFooter() {
    return (
        <footer className="border-theme-on-surface/10 mt-16 border-t">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="space-y-1">
                    <p className="text-sm font-semibold">{siteConfig.name}</p>
                    <p className="text-theme-on-surface/60 text-xs">
                        Open-source form builder and response collection.
                    </p>
                </div>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        {footerLinks.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className={linkClass}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <a
                                href={siteConfig.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClass}
                            >
                                GitHub
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
