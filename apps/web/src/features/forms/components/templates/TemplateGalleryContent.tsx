'use client';

import type { ReactNode } from 'react';
import type { TemplateSummary } from '@/features/forms/api/user/templates';
import { cn } from '@/utils/cn';

const GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';
const ROW_CARD = 'w-full shrink-0';
const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

function SectionHeading({ title, count }: { title: string; count?: number }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <h2 className="text-theme-on-surface text-base font-semibold tracking-tight">
                {title}
            </h2>
            {typeof count === 'number' && (
                <span className="text-theme-on-surface/50 text-xs font-medium tabular-nums">
                    {count}
                </span>
            )}
            <span className="bg-theme-on-surface/10 h-px flex-1" />
        </div>
    );
}

function StateMessage({
    icon,
    message,
    action,
}: {
    icon: string;
    message: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="bg-brand-light text-on-brand-light flex h-14 w-14 items-center justify-center rounded-lg">
                <span className="material-symbols-outlined text-3xl">
                    {icon}
                </span>
            </span>
            <p className="text-theme-on-surface/65 max-w-sm text-sm">
                {message}
            </p>
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                        'bg-brand text-on-brand rounded-md px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90',
                        FOCUS_RING
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

interface TemplateGalleryContentProps {
    error: string | null;
    templates: TemplateSummary[] | null;
    search: string;
    visibleCategories: [string, TemplateSummary[]][];
    recentTemplates: TemplateSummary[];
    showStartRow: boolean;
    renderCard: (template: TemplateSummary) => ReactNode;
    onRetry: () => void;
    onCreateBlank: () => void;
    onClearSearch: () => void;
    onShowAll: () => void;
}

type GalleryState = 'error' | 'loading' | 'empty' | 'noMatches' | 'ready';

export default function TemplateGalleryContent({
    error,
    templates,
    search,
    visibleCategories,
    recentTemplates,
    showStartRow,
    renderCard,
    onRetry,
    onCreateBlank,
    onClearSearch,
    onShowAll,
}: TemplateGalleryContentProps) {
    const hasTemplates = Boolean(templates && templates.length > 0);
    const noMatches = hasTemplates && visibleCategories.length === 0;

    let state: GalleryState;
    switch (true) {
        case Boolean(error):
            state = 'error';
            break;
        case templates === null:
            state = 'loading';
            break;
        case templates && templates.length === 0:
            state = 'empty';
            break;
        case noMatches:
            state = 'noMatches';
            break;
        default:
            state = 'ready';
    }

    switch (state) {
        case 'error':
            return (
                <StateMessage
                    icon="cloud_off"
                    message={error ?? 'Could not load templates.'}
                    action={{ label: 'Try again', onClick: onRetry }}
                />
            );
        case 'loading':
            return (
                <div className={GRID}>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="border-theme-on-surface/10 overflow-hidden rounded-lg border"
                        >
                            <div className="bg-theme-skeletion-surface aspect-4/3 w-full motion-safe:animate-pulse" />
                            <div className="border-theme-on-surface/10 space-y-2 border-t px-4 py-3">
                                <div className="bg-theme-skeletion-surface rounded-theme-skeletion-text h-3.5 w-2/3 motion-safe:animate-pulse" />
                                <div className="bg-theme-skeletion-surface rounded-theme-skeletion-text h-3 w-1/3 motion-safe:animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'empty':
            return (
                <StateMessage
                    icon="dashboard_customize"
                    message="No templates are available yet. Start with a blank form instead."
                    action={{
                        label: 'Create blank form',
                        onClick: onCreateBlank,
                    }}
                />
            );
        case 'noMatches':
            return (
                <StateMessage
                    icon="search_off"
                    message={
                        search
                            ? `No templates match “${search}”. Try a different word, or start from a blank form.`
                            : 'No templates in this category yet.'
                    }
                    action={
                        search
                            ? { label: 'Clear search', onClick: onClearSearch }
                            : {
                                  label: 'Show all templates',
                                  onClick: onShowAll,
                              }
                    }
                />
            );
        case 'ready':
            return (
                <div className="flex flex-col gap-10 pb-12">
                    {showStartRow && (
                        <section>
                            <SectionHeading
                                title={
                                    recentTemplates.length > 0
                                        ? 'Recently used'
                                        : 'Start a new form'
                                }
                            />
                            <div className={GRID}>
                                {/* <div className={ROW_CARD}>{blankCard}</div> */}
                                {recentTemplates.map((template) => (
                                    <div key={template.id} className={ROW_CARD}>
                                        {renderCard(template)}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {visibleCategories.map(([category, items]) => (
                        <section key={category}>
                            <SectionHeading
                                title={category}
                                count={items.length}
                            />
                            <div className={GRID}>{items.map(renderCard)}</div>
                        </section>
                    ))}
                </div>
            );
    }
}
