import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Link unavailable | Paperwork',
    robots: { index: false, follow: false },
};

export default function UnavailablePage() {
    return (
        <main className="bg-theme-surface text-theme-on-surface flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="material-symbols-outlined text-brand-depth text-5xl">
                link_off
            </span>
            <h1 className="text-xl font-semibold">
                This link is not available
            </h1>
            <p className="text-theme-on-surface/70 max-w-md text-sm leading-relaxed">
                The short link may be incorrect, or the form may have been
                unpublished. Ask the form owner to send a new link.
            </p>
            <Link
                href="/"
                className="bg-theme-form-container-active text-theme-form-on-active rounded-md px-4 py-2 text-sm font-medium"
            >
                Go to Paperwork
            </Link>
        </main>
    );
}
