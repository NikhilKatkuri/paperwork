import Link from 'next/link';
import { Reveal } from './Reveal';
import { cn } from '@/utils/cn';

const linkClass =
    'text-brand-depth focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface inline-flex items-center gap-1 rounded-md text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

function SectionHeader({
    index,
    title,
    description,
    href,
    label = 'Learn more',
}: {
    index: string;
    title: string;
    description: string;
    href: string;
    label?: string;
}) {
    return (
        <div className="max-w-xl">
            <p className="text-theme-on-surface/45 font-mono text-xs font-semibold tracking-widest">
                {index}
            </p>
            <h3 className="text-theme-on-surface mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
            </h3>
            <p className="text-theme-on-surface/70 mt-4 text-base leading-relaxed">
                {description}
            </p>
            <Link href={href} className={cn(linkClass, 'mt-5')}>
                {label}
                <span
                    className="material-symbols-outlined !text-lg"
                    aria-hidden
                >
                    arrow_forward
                </span>
            </Link>
        </div>
    );
}

function FeatureChips({ items }: { items: string[] }) {
    return (
        <div className="mt-12">
            <p className="text-theme-on-surface/55 font-mono text-xs font-semibold tracking-widest uppercase">
                Features
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {items.map((item) => (
                    <li
                        key={item}
                        className="text-theme-on-surface/75 inline-flex items-center gap-1.5 text-sm font-medium"
                    >
                        {item}
                        <span className="text-brand-depth text-lg leading-none">
                            +
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BuilderMockup() {
    return (
        <div className="border-theme-on-surface/10 bg-theme-form-container relative overflow-hidden rounded-2xl border p-5 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Leave Request</span>
                <span className="bg-brand-light text-on-brand-light rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    Draft
                </span>
            </div>
            <div className="mt-4 space-y-2">
                {[
                    { label: 'Personal details', type: 'Section' },
                    { label: 'Employee name', type: 'Short text' },
                    { label: 'Leave type', type: 'Dropdown' },
                    { label: 'Dates', type: 'Date' },
                ].map((row, i) => (
                    <div
                        key={row.label}
                        className={cn(
                            'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                            i === 0
                                ? 'border-brand-depth/30 bg-brand-light/40 font-semibold'
                                : 'border-theme-on-surface/10 bg-theme-surface'
                        )}
                    >
                        <span>{row.label}</span>
                        <span className="text-theme-on-surface/55 font-mono text-[11px]">
                            {row.type}
                        </span>
                    </div>
                ))}
            </div>
            <div className="border-theme-on-surface/10 mt-4 flex items-center gap-2 border-t pt-3 text-xs text-theme-on-surface/60">
                <span
                    className="material-symbols-outlined text-brand-depth !text-base"
                    aria-hidden
                >
                    save
                </span>
                Draft saved in your browser
            </div>
        </div>
    );
}

function ResponsesMockup() {
    return (
        <div className="border-theme-on-surface/10 bg-theme-form-container relative overflow-hidden rounded-2xl border p-5 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Responses</span>
                <span className="text-theme-on-surface/55 inline-flex items-center gap-1 font-mono text-[11px]">
                    <span
                        className="material-symbols-outlined !text-sm"
                        aria-hidden
                    >
                        search
                    </span>
                    Search · Filter
                </span>
            </div>
            <div className="border-theme-on-surface/10 mt-4 overflow-hidden rounded-lg border">
                <div className="border-theme-on-surface/10 text-theme-on-surface/55 grid grid-cols-3 gap-2 border-b px-3 py-2 text-[11px] font-semibold">
                    <span>Email</span>
                    <span>Form</span>
                    <span>Status</span>
                </div>
                {[
                    ['a.sharma@', 'Leave Request', 'New'],
                    ['r.mehta@', 'Expense Claim', 'Reviewed'],
                    ['s.rao@', 'Service Agreement', 'New'],
                ].map((row) => (
                    <div
                        key={row[0]}
                        className="text-theme-on-surface/70 grid grid-cols-3 gap-2 border-b border-theme-on-surface/10 px-3 py-2.5 text-xs last:border-0"
                    >
                        <span>{row[0]}</span>
                        <span>{row[1]}</span>
                        <span className="text-brand-depth font-medium">
                            {row[2]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExportMockup() {
    return (
        <div className="border-theme-on-surface/10 bg-theme-form-container relative overflow-hidden rounded-2xl border p-5 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Export responses</span>
                <span className="bg-brand-light text-on-brand-light rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    CSV
                </span>
            </div>
            <div className="border-theme-on-surface/10 bg-theme-surface mt-4 overflow-hidden rounded-lg border">
                <div className="text-theme-on-surface/55 grid grid-cols-3 gap-2 border-b border-theme-on-surface/10 px-3 py-2 font-mono text-[11px]">
                    <span>email</span>
                    <span>form</span>
                    <span>submitted_at</span>
                </div>
                <div className="text-theme-on-surface/70 grid grid-cols-3 gap-2 px-3 py-2.5 font-mono text-[11px]">
                    <span>a.sharma@...</span>
                    <span>leave_request</span>
                    <span>2026-11-26</span>
                </div>
                <div className="text-theme-on-surface/70 grid grid-cols-3 gap-2 px-3 py-2.5 font-mono text-[11px]">
                    <span>r.mehta@...</span>
                    <span>expense_claim</span>
                    <span>2026-11-25</span>
                </div>
            </div>
            <div className="border-theme-on-surface/10 mt-4 flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-theme-on-surface/60">
                    Your data, in a portable format
                </span>
                <span className="bg-brand-depth text-on-brand-depth inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold">
                    <span
                        className="material-symbols-outlined !text-sm"
                        aria-hidden
                    >
                        download
                    </span>
                    Download
                </span>
            </div>
        </div>
    );
}

export function FeatureSections() {
    return (
        <section id="features" className="border-theme-on-surface/10 border-t">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
                {[
                    {
                        index: '01 / BUILD',
                        title: 'Build the form you actually need',
                        description:
                            'Organize questions into sections and choose from several question types. Set required fields and validation rules, while drafts stay in your browser as you edit.',
                        href: '/help',
                        chips: [
                            'Sections',
                            'Question types',
                            'Validation rules',
                            'Auto-saved drafts',
                        ],
                        mockup: <BuilderMockup />,
                    },
                    {
                        index: '02 / COLLECT',
                        title: 'Publish a link and collect responses',
                        description:
                            'Choose when a form is ready to accept responses, share its link with signed-in users, then view and search the submissions that come back.',
                        href: '/help',
                        chips: [
                            'Publish controls',
                            'Shareable link',
                            'Search',
                            'Filters',
                        ],
                        mockup: <ResponsesMockup />,
                    },
                    {
                        index: '03 / EXPORT',
                        title: 'Take your data with you',
                        description:
                            'Export a form’s responses as CSV whenever you need it. Paperwork is open source and can be self-hosted, so your data stays under your control.',
                        href: '/about',
                        chips: [
                            'One-click CSV',
                            'Open source',
                            'Self-hostable',
                            'No lock-in',
                        ],
                        mockup: <ExportMockup />,
                    },
                ].map((section, i) => (
                    <div
                        key={section.index}
                        className="border-theme-on-surface/10 border-b py-16 sm:py-24"
                    >
                        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                            <Reveal
                                className={i % 2 === 1 ? 'lg:order-2' : ''}
                            >
                                <SectionHeader {...section} />
                            </Reveal>
                            <Reveal
                                delay={100}
                                yOffset={24}
                                className={i % 2 === 1 ? 'lg:order-1' : ''}
                            >
                                {section.mockup}
                            </Reveal>
                        </div>
                        <Reveal delay={140}>
                            <FeatureChips items={section.chips} />
                        </Reveal>
                    </div>
                ))}
            </div>
        </section>
    );
}
