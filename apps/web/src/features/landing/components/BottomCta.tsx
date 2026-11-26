import Link from 'next/link';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

const primaryClass =
    'bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

const secondaryClass =
    'border-theme-on-surface/15 hover:bg-theme-surface-hover inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

export function BottomCta() {
    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal>
                <div className="text-center">
                    <h2 className="text-theme-on-surface mx-auto max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                        Built for the way you work. Available today.
                    </h2>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link href="/auth?mode=signup" className={primaryClass}>
                            Get Started Free
                        </Link>
                        <Link href="/auth" className={secondaryClass}>
                            Sign In
                        </Link>
                    </div>
                    <p
                        className={cn(
                            'text-theme-on-surface/55 mt-5 font-mono text-xs tracking-wide'
                        )}
                    >
                        Open source · Self-hostable · CSV export
                    </p>
                </div>
            </Reveal>
        </section>
    );
}
