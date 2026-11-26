import Image from 'next/image';
import { siteConfig } from '@/config/site';

const recentForms = [
    'Course Evaluation',
    'Find a Time',
    'Order Form',
    'Assessment',
    'Exit Ticket',
    'Job Application',
    'Event Feedback',
    'Work Request',
];

const navItems = [
    { icon: 'home', label: 'Home', active: true },
    { icon: 'grid_view', label: 'Templates', active: false },
    { icon: 'settings', label: 'Settings', active: false },
];

export function HeroPreview() {
    return (
        <div className="mx-auto w-full max-w-5xl">
            {/* MacBook lid */}
            <div className="border-theme-on-surface/15 bg-theme-on-surface/[0.06] rounded-t-[1.5rem] border p-2 shadow-2xl shadow-black/10 sm:p-3">
                <div className="border-theme-on-surface/10 bg-theme-form-container relative overflow-hidden rounded-t-lg border">
                    <div
                        aria-hidden
                        className="bg-theme-on-surface/25 absolute top-1.5 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    />

                    {/* Browser chrome */}
                    <div className="border-theme-on-surface/10 bg-theme-surface/80 flex h-9 items-center gap-2 border-b px-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                        <span className="text-theme-on-surface/50 mx-auto rounded-md px-3 font-mono text-[10px]">
                            paperwork.app/home
                        </span>
                    </div>

                    {/* App UI */}
                    <div className="grid grid-cols-[68px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)]">
                        {/* Sidebar */}
                        <aside className="border-theme-on-surface/10 bg-brand-light/25 flex flex-col items-center border-r py-4">
                            <nav className="flex w-full flex-col gap-1">
                                {navItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex flex-col items-center gap-1 py-1.5"
                                    >
                                        <span
                                            className={`material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-lg !text-lg ${
                                                item.active
                                                    ? 'bg-brand-depth text-on-brand-depth'
                                                    : 'text-theme-on-surface/60'
                                            }`}
                                            aria-hidden
                                        >
                                            {item.icon}
                                        </span>
                                        <span className="text-theme-on-surface/70 text-[10px] font-medium">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </nav>
                            <span
                                className="border-theme-on-surface/20 mt-auto h-6 w-6 rounded-full border bg-gradient-to-br from-emerald-300 to-sky-400"
                                aria-hidden
                            />
                        </aside>

                        {/* Main */}
                        <div className="min-w-0 px-3 py-4 sm:px-5 sm:py-5">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <Image
                                        src="/paperwork_icon-vector-master.svg"
                                        alt=""
                                        width={20}
                                        height={20}
                                    />
                                    <span className="hidden text-sm font-bold tracking-tight sm:inline">
                                        {siteConfig.name}
                                    </span>
                                </div>
                                <div className="border-theme-on-surface/10 bg-theme-surface flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-full border px-3">
                                    <span
                                        className="material-symbols-outlined text-theme-on-surface/50 !text-sm"
                                        aria-hidden
                                    >
                                        search
                                    </span>
                                    <span className="text-theme-on-surface/55 truncate text-[11px]">
                                        Search forms
                                    </span>
                                    <span className="text-theme-on-surface/45 ml-auto hidden font-mono text-[10px] sm:inline">
                                        Ctrl K
                                    </span>
                                </div>
                            </div>

                            {/* Templates */}
                            <div className="bg-brand-light/25 mt-5 rounded-xl p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-theme-on-surface/55 text-[10px] font-semibold tracking-widest uppercase">
                                        Templates
                                    </span>
                                    <span className="text-brand-depth hidden items-center gap-1 text-[10px] font-medium sm:inline-flex">
                                        More templates
                                        <span
                                            className="material-symbols-outlined !text-xs"
                                            aria-hidden
                                        >
                                            arrow_forward
                                        </span>
                                    </span>
                                </div>
                                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:max-w-[60%]">
                                    {[
                                        {
                                            title: 'Event Registration',
                                            meta: '11 questions · about 3 min · Personal',
                                        },
                                        {
                                            title: 'Party Invite',
                                            meta: '6 questions · about 2 min · Personal',
                                        },
                                    ].map((card) => (
                                        <div
                                            key={card.title}
                                            className="border-theme-on-surface/10 bg-theme-form-container rounded-lg border p-2.5"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="bg-brand-depth text-on-brand-depth flex h-5 w-5 items-center justify-center rounded-md">
                                                    <span
                                                        className="material-symbols-outlined !text-[11px]"
                                                        aria-hidden
                                                    >
                                                        list_bulleted
                                                    </span>
                                                </span>
                                                <span className="truncate text-[11px] font-semibold">
                                                    {card.title}
                                                </span>
                                            </div>
                                            <p className="text-theme-on-surface/55 mt-1.5 truncate text-[10px]">
                                                {card.meta}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent forms */}
                            <div className="mt-5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">
                                        Recent forms
                                    </span>
                                    <div className="flex items-center gap-2 text-theme-on-surface/55">
                                        <span className="hidden text-[10px] sm:inline">
                                            Last opened by me
                                        </span>
                                        <span
                                            className="material-symbols-outlined !text-sm"
                                            aria-hidden
                                        >
                                            table_rows
                                        </span>
                                        <span className="text-[11px] font-semibold">
                                            A↕Z
                                        </span>
                                    </div>
                                </div>
                                <div className="text-theme-on-surface/55 mt-3 flex items-center justify-between text-[10px]">
                                    <span>Long press a form to select it</span>
                                    <span className="flex items-center gap-2">
                                        Select all
                                        <span
                                            className="material-symbols-outlined !text-sm"
                                            aria-hidden
                                        >
                                            delete_outline
                                        </span>
                                    </span>
                                </div>
                                <div className="border-theme-on-surface/10 mt-2 overflow-hidden rounded-lg border">
                                    {recentForms.map((form, i) => (
                                        <div
                                            key={form}
                                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] ${
                                                i === 0
                                                    ? 'bg-brand-light/50'
                                                    : 'border-theme-on-surface/10 border-t'
                                            }`}
                                        >
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <span className="bg-brand-depth text-on-brand-depth flex h-5 w-5 shrink-0 items-center justify-center rounded-md">
                                                    <span
                                                        className="material-symbols-outlined !text-[11px]"
                                                        aria-hidden
                                                    >
                                                        list_bulleted
                                                    </span>
                                                </span>
                                                <span className="truncate font-medium">
                                                    {form}
                                                </span>
                                            </span>
                                            <span className="text-theme-on-surface/55 flex shrink-0 items-center gap-2">
                                                <span className="hidden font-mono text-[10px] sm:inline">
                                                    Nov 26, 2026
                                                </span>
                                                <span
                                                    className="material-symbols-outlined !text-sm"
                                                    aria-hidden
                                                >
                                                    more_vert
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MacBook chin */}
                <div className="h-2 sm:h-3" />
            </div>

            {/* MacBook base */}
            <div className="bg-theme-on-surface/[0.06] mx-auto h-2 w-[104%] -translate-x-[2%] rounded-b-xl border-x border-b border-theme-on-surface/15" />
        </div>
    );
}
