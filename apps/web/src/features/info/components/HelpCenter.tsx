'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { faqCategories, type FaqItem } from '../data/faq';

const normalize = (value: string) => value.toLowerCase();

function itemHaystack(item: FaqItem, categoryTitle: string): string {
    return normalize(
        [
            item.question,
            categoryTitle,
            ...(item.paragraphs ?? []),
            ...(item.bullets ?? []),
        ].join(' ')
    );
}

const linkClass =
    'rounded-md text-sm font-medium text-brand-depth underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function HelpCenter() {
    const [query, setQuery] = useState('');

    const tokens = useMemo(
        () =>
            normalize(query)
                .split(/\s+/)
                .map((token) => token.trim())
                .filter(Boolean),
        [query]
    );

    const filtered = useMemo(() => {
        if (tokens.length === 0) return faqCategories;

        return faqCategories
            .map((category) => ({
                ...category,
                items: category.items.filter((item) => {
                    const haystack = itemHaystack(item, category.title);
                    return tokens.every((token) => haystack.includes(token));
                }),
            }))
            .filter((category) => category.items.length > 0);
    }, [tokens]);

    const matchCount = filtered.reduce(
        (total, category) => total + category.items.length,
        0
    );

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="relative">
                    <span
                        aria-hidden
                        className="material-symbols-outlined text-theme-on-surface/50 pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg"
                    >
                        search
                    </span>
                    <label htmlFor="faq-search" className="sr-only">
                        Search help articles
                    </label>
                    <input
                        id="faq-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search help articles…"
                        autoComplete="off"
                        className="border-theme-on-surface/20 bg-theme-surface text-theme-on-surface placeholder:text-theme-on-surface/50 focus-visible:border-brand-depth focus-visible:ring-brand-depth/40 w-full rounded-full border py-3 pr-12 pl-12 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="text-theme-on-surface/60 hover:text-theme-on-surface focus-visible:ring-brand-depth absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <span
                                aria-hidden
                                className="material-symbols-outlined text-lg"
                            >
                                close
                            </span>
                            <span className="sr-only">Clear search</span>
                        </button>
                    )}
                </div>

                {!query && (
                    <nav aria-label="Help categories">
                        <ul className="flex flex-wrap gap-2">
                            {faqCategories.map((category) => (
                                <li key={category.id}>
                                    <a
                                        href={`#${category.id}`}
                                        className="border-theme-on-surface/15 text-theme-on-surface/80 hover:bg-theme-surface-hover focus-visible:ring-brand-depth inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        <span
                                            aria-hidden
                                            className="material-symbols-outlined text-sm"
                                        >
                                            {category.icon}
                                        </span>
                                        {category.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <p
                    aria-live="polite"
                    className="text-theme-on-surface/60 text-xs"
                >
                    {query
                        ? `${matchCount} ${matchCount === 1 ? 'answer' : 'answers'} found`
                        : `${faqCategories.length} categories`}
                </p>
            </div>

            {filtered.length === 0 ? (
                <div className="border-theme-on-surface/20 rounded-2xl border border-dashed p-8 text-center">
                    <span
                        aria-hidden
                        className="material-symbols-outlined text-theme-on-surface/40 text-3xl"
                    >
                        search_off
                    </span>
                    <p className="mt-3 text-sm font-medium">
                        No results for “{query.trim()}”
                    </p>
                    <p className="text-theme-on-surface/70 mx-auto mt-1 max-w-md text-sm">
                        Try a shorter or more general keyword, or ask the
                        maintainers directly — include what you were doing and
                        the exact error message.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/contact" className={linkClass}>
                            Contact &amp; support
                        </Link>
                        <a
                            href={siteConfig.issuesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClass}
                        >
                            Open a GitHub issue
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    {filtered.map((category) => (
                        <section
                            key={category.id}
                            id={category.id}
                            aria-labelledby={`${category.id}-heading`}
                            className="scroll-mt-6 space-y-3"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    aria-hidden
                                    className="material-symbols-outlined text-brand-depth mt-0.5 text-2xl"
                                >
                                    {category.icon}
                                </span>
                                <div>
                                    <h2
                                        id={`${category.id}-heading`}
                                        className="text-lg font-semibold"
                                    >
                                        {category.title}
                                    </h2>
                                    <p className="text-theme-on-surface/70 text-sm">
                                        {category.description}
                                    </p>
                                </div>
                            </div>

                            <div className="divide-theme-on-surface/10 border-theme-on-surface/15 divide-y rounded-2xl border">
                                {category.items.map((item) => (
                                    <details
                                        key={item.id}
                                        id={item.id}
                                        className="group scroll-mt-6"
                                    >
                                        <summary className="hover:bg-theme-surface-hover focus-visible:ring-brand-depth flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                                            {item.question}
                                            <span
                                                aria-hidden
                                                className="material-symbols-outlined text-theme-on-surface/50 shrink-0 text-lg transition-transform duration-200 group-open:rotate-180"
                                            >
                                                expand_more
                                            </span>
                                        </summary>
                                        <div className="text-theme-on-surface/80 space-y-2 px-4 pb-4 text-sm leading-relaxed">
                                            {item.paragraphs?.map(
                                                (paragraph) => (
                                                    <p key={paragraph}>
                                                        {paragraph}
                                                    </p>
                                                )
                                            )}
                                            {item.bullets && (
                                                <ul className="marker:text-theme-on-surface/40 list-disc space-y-1.5 pl-5">
                                                    {item.bullets.map(
                                                        (bullet) => (
                                                            <li key={bullet}>
                                                                {bullet}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                            {item.links && (
                                                <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-1">
                                                    {item.links.map((link) => (
                                                        <li key={link.href}>
                                                            {link.external ? (
                                                                <a
                                                                    href={
                                                                        link.href
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={
                                                                        linkClass
                                                                    }
                                                                >
                                                                    {link.label}
                                                                    <span className="sr-only">
                                                                        {' '}
                                                                        (opens
                                                                        in a new
                                                                        tab)
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <Link
                                                                    href={
                                                                        link.href
                                                                    }
                                                                    className={
                                                                        linkClass
                                                                    }
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
