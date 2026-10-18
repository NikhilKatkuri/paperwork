import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPageShell, {
    type TocItem,
} from '@/features/info/components/InfoPageShell';
import HelpCenter from '@/features/info/components/HelpCenter';
import { faqCategories } from '@/features/info/data/faq';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
    title: `${siteConfig.name} | Help Center`,
    description:
        'Answers to common questions about creating forms, collecting responses, privacy, security and troubleshooting in Paperwork.',
};

const toc: TocItem[] = faqCategories.map((category) => ({
    id: category.id,
    label: category.title,
}));

const linkClass =
    'rounded-md text-sm font-medium text-brand-depth underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function HelpPage() {
    return (
        <InfoPageShell
            title="Help Center"
            intro="Short, practical answers about building forms and collecting responses in Paperwork. Search the articles below, or jump to a category. If something is missing, the contact channels are at the bottom of this page."
            toc={toc}
        >
            <HelpCenter />

            <section
                aria-labelledby="still-need-help"
                className="border-theme-on-surface/15 bg-brand-depth/5 mt-12 rounded-2xl border p-6 sm:p-8"
            >
                <h2 id="still-need-help" className="text-lg font-semibold">
                    Still need help?
                </h2>
                <p className="text-theme-on-surface/80 mt-1 max-w-2xl text-sm leading-relaxed">
                    Bugs and feature requests go to GitHub Issues. Privacy and
                    deletion requests go through the contact page. The Privacy
                    Policy and Terms explain what is stored and what rules
                    apply.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    <Link href="/contact" className={linkClass}>
                        Contact &amp; support
                    </Link>
                    <Link href="/privacy" className={linkClass}>
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className={linkClass}>
                        Terms &amp; Conditions
                    </Link>
                </div>
            </section>
        </InfoPageShell>
    );
}
