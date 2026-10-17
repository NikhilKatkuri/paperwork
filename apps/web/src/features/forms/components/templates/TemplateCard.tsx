'use client';

import { useEffect, useMemo, useRef } from 'react';
import { type TemplateSummary } from '@/features/forms/api/user/templates';
import { cn } from '@/utils/cn';
import { getTemplateStats, isFeatured } from './templateMeta';

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

interface TemplateCardProps {
    template: TemplateSummary;
    onUse: (template: TemplateSummary) => void;
    onPreview: (template: TemplateSummary) => void;
    cloning: boolean;
    disabled: boolean;
}

export default function TemplateCard({
    template,
    onUse,
    onPreview,
    cloning,
    disabled,
}: TemplateCardProps) {
    const stats = useMemo(() => getTemplateStats(template), [template]);
    const featured = isFeatured(template);
    const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (previewTimer.current) clearTimeout(previewTimer.current);
        },
        []
    );

    const cancelPreview = () => {
        if (previewTimer.current) {
            clearTimeout(previewTimer.current);
            previewTimer.current = null;
        }
    };

    const schedulePreview = () => {
        if (cloning || disabled) return;

        cancelPreview();
        previewTimer.current = setTimeout(() => {
            previewTimer.current = null;
            onPreview(template);
        }, 2000);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => !cloning && !disabled && onUse(template)}
            onMouseEnter={schedulePreview}
            onMouseLeave={cancelPreview}
            onKeyDown={(e) => {
                if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    !cloning &&
                    !disabled
                ) {
                    e.preventDefault();
                    onUse(template);
                }
            }}
            aria-busy={cloning}
            aria-label={`Use ${template.name} template`}
            className={cn(
                'hover:bg-brand-light border-theme-skeletion-surface relative grid w-full cursor-pointer items-center gap-2 rounded-md border p-4 transition-all duration-150 ease-in-out *:text-sm',
                FOCUS_RING,
                disabled && !cloning && 'pointer-events-none opacity-50'
            )}
        >
            <div className="flex flex-col gap-2">
                <div className="grid h-8 grid-cols-[36px_1fr] items-center gap-1">
                    <div className="bg-theme-form-container-active flex h-7 w-7 items-center justify-center rounded-md">
                        <span className="material-symbols-outlined text-on-brand-depth text-base">
                            format_list_bulleted
                        </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                        <p className="text-theme-on-surface truncate font-medium">
                            {template.name}
                        </p>
                        {featured && (
                            <span className="bg-brand-light text-on-brand-light inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                                <span className="material-symbols-outlined material-filled text-xs">
                                    star
                                </span>
                                Featured
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-theme-on-surface/55 my-2 text-xs">
                {stats.questions} questions · about {stats.minutes} min{' '}
                {template.category ? `· ${template.category}` : ''}
            </p>

            {cloning && (
                <div className="bg-theme-surface/80 absolute inset-0 flex items-center justify-center rounded-md backdrop-blur-xs">
                    <span className="border-brand/30 border-t-brand h-6 w-6 rounded-full border-2 motion-safe:animate-spin" />
                </div>
            )}
        </div>
    );
}
