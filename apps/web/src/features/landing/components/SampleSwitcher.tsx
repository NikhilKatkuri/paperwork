'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';
import { samplePresets } from '../data/samples';

const focusClass =
    'focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

export function SampleSwitcher() {
    const [activeId, setActiveId] = useState(samplePresets[0].id);
    const active = samplePresets.find((preset) => preset.id === activeId)!;

    return (
        <section
            id="use-cases"
            className="border-theme-on-surface/10 border-t py-16 sm:py-24"
        >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <Reveal>
                        <p className="text-theme-on-surface/45 font-mono text-xs font-semibold tracking-widest">
                            04 / USE CASES
                        </p>
                        <h2 className="text-theme-on-surface mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Start from a ready-made form
                        </h2>
                        <p className="text-theme-on-surface/70 mt-4 text-base leading-relaxed">
                            Explore sample paperwork right here — no account
                            needed. Switch between presets to see the fields and
                            validation rules you can put together, then open the
                            editor to make one your own.
                        </p>
                        <Link
                            href="/forms/templates"
                            className={cn(
                                focusClass,
                                'text-brand-depth mt-5 inline-flex items-center gap-1 rounded-md text-sm font-semibold'
                            )}
                        >
                            Browse templates
                            <span
                                className="material-symbols-outlined !text-lg"
                                aria-hidden
                            >
                                arrow_forward
                            </span>
                        </Link>
                    </Reveal>

                    <Reveal delay={100} yOffset={24}>
                        <div className="border-theme-on-surface/10 bg-theme-form-container overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
                            <div
                                className="border-theme-on-surface/10 bg-theme-surface/70 flex flex-wrap gap-1 border-b px-3 py-2.5"
                                role="tablist"
                                aria-label="Sample paperwork"
                            >
                                {samplePresets.map((preset) => {
                                    const selected = preset.id === activeId;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={selected}
                                            aria-controls="sample-panel"
                                            onClick={() => setActiveId(preset.id)}
                                            className={cn(
                                                focusClass,
                                                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                                selected
                                                    ? 'bg-brand-depth text-on-brand-depth'
                                                    : 'text-theme-on-surface/65 hover:bg-theme-surface-hover'
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div id="sample-panel" role="tabpanel" className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {active.title}
                                        </p>
                                        <p className="text-theme-on-surface/65 mt-1 text-sm">
                                            {active.description}
                                        </p>
                                    </div>
                                    <span className="border-theme-on-surface/15 rounded-full border px-2.5 py-1 text-[11px] font-medium">
                                        {active.category}
                                    </span>
                                </div>

                                <div className="border-theme-on-surface/10 bg-theme-surface divide-theme-on-surface/10 mt-4 divide-y overflow-hidden rounded-lg border">
                                    {active.fields.map((field) => (
                                        <div
                                            key={field.label}
                                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-xs"
                                        >
                                            <span className="flex items-center gap-2 font-medium">
                                                {field.label}
                                                {field.required && (
                                                    <span className="bg-brand-light text-on-brand-light rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                                        Required
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-theme-on-surface/60 flex items-center gap-2">
                                                {field.rule && (
                                                    <span className="border-theme-on-surface/15 rounded border px-1.5 py-0.5">
                                                        {field.rule}
                                                    </span>
                                                )}
                                                <span className="font-mono">
                                                    {field.type}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/auth"
                                    className={cn(
                                        focusClass,
                                        'bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 mt-4 inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors'
                                    )}
                                >
                                    Open in Editor
                                    <span
                                        className="material-symbols-outlined !text-base"
                                        aria-hidden
                                    >
                                        arrow_forward
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
