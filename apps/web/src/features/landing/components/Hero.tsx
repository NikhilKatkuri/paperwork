import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { cn } from '@/utils/cn';
import { HeroPreview } from './HeroPreview';
import { Reveal } from './Reveal';

const focusClass =
    'focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

export function Hero() {
    return (
        <section className="relative overflow-hidden pt-16 sm:pt-24">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
            >
                <div className="bg-brand-light/40 absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full blur-3xl" />
                <div
                    className="opacity-[0.035] dark:opacity-[0.06]"
                    style={{
                        backgroundImage:
                            'radial-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        height: '100%',
                        width: '100%',
                    }}
                />
            </div>

            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
                <Reveal className="mx-auto max-w-4xl text-center">
                    <div className="border-theme-on-surface/10 bg-theme-form-container/90 inline-flex items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-xs font-semibold shadow-xs backdrop-blur-sm">
                        <span className="bg-brand-depth text-on-brand-depth inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]">
                            <span
                                className="material-symbols-outlined !text-xs"
                                aria-hidden
                            >
                                code
                            </span>
                            Open source
                        </span>
                        <span className="text-theme-on-surface/80">
                            Build forms, collect responses, export CSV
                        </span>
                    </div>

                    <h1 className="text-theme-on-surface mt-8 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]">
                        A simpler way to build forms and collect responses.
                    </h1>

                    <p className="text-theme-on-surface/70 mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
                        Paperwork is an open-source form builder and response
                        collection app. Create forms from scratch or from a
                        template, publish a shareable link, review submissions,
                        and export them as CSV.
                    </p>

                    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/auth?mode=signup"
                            className={cn(
                                focusClass,
                                'group bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
                            )}
                        >
                            Start Building Free
                            <span
                                className="material-symbols-outlined !text-lg transition-transform duration-200 group-hover:translate-x-0.5"
                                aria-hidden
                            >
                                arrow_forward
                            </span>
                        </Link>
                        <a
                            href="#features"
                            className={cn(
                                focusClass,
                                'border-theme-on-surface/15 bg-theme-form-container/70 hover:bg-theme-surface-hover hover:border-theme-on-surface/30 inline-flex items-center justify-center gap-2 border px-6 py-3.5 text-sm font-semibold transition-all duration-200'
                            )}
                        >
                            See How It Works
                            <span
                                className="material-symbols-outlined !text-lg"
                                aria-hidden
                            >
                                arrow_downward
                            </span>
                        </a>
                    </div>

                    <a
                        href={siteConfig.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            focusClass,
                            'text-brand-depth mt-6 inline-flex items-center gap-1.5 text-sm font-medium'
                        )}
                    >
                        Open source and self-hostable
                        <span
                            className="material-symbols-outlined !text-base"
                            aria-hidden
                        >
                            arrow_forward
                        </span>
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                </Reveal>

                <Reveal delay={140} yOffset={28} className="mt-14 sm:mt-20">
                    <HeroPreview />
                </Reveal>

                <Reveal delay={180}>
                    <p className="text-theme-on-surface/55 mt-8 text-center font-mono text-xs font-semibold tracking-widest uppercase">
                        A focused workspace for forms and responses
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
