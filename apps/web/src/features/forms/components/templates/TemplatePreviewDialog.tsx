'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TemplateSummary } from '@/features/forms/api/user/templates';
import { cn } from '@/utils/cn';
import { getTemplateStats } from './templateMeta';
import TemplatePreview from './TemplatePreview';

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

interface TemplatePreviewDialogProps {
    template: TemplateSummary;
    /** True while this template is being cloned. */
    busy: boolean;
    /** True while a different template is being cloned. */
    disabled: boolean;
    onClose: () => void;
    onUse: (template: TemplateSummary) => void | Promise<void>;
}

function Stat({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="bg-theme-on-surface/5 text-theme-on-surface/75 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
            <span className="material-symbols-outlined text-base">{icon}</span>
            {label}
        </span>
    );
}

export default function TemplatePreviewDialog({
    template,
    busy,
    disabled,
    onClose,
    onUse,
}: TemplatePreviewDialogProps) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const stats = useMemo(() => getTemplateStats(template), [template]);

    // Latest values for the key handler without re-subscribing.
    const stateRef = useRef({ busy, onClose });
    useEffect(() => {
        stateRef.current = { busy, onClose };
    }, [busy, onClose]);

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        primaryRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (!stateRef.current.busy) {
                    event.stopPropagation();
                    stateRef.current.onClose();
                }
                return;
            }

            if (event.key !== 'Tab') return;

            const nodes =
                dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
            if (!nodes || nodes.length === 0) return;

            const first = nodes[0];
            const last = nodes[nodes.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, []);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs min-[44rem]:items-center min-[44rem]:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-theme-surface border-theme-on-surface/15 motion-safe:animate-scale-in flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg border shadow-2xl min-[44rem]:max-h-[88dvh] min-[44rem]:rounded-lg"
            >
                {/* Header */}
                <div className="border-theme-on-surface/10 flex items-start justify-between gap-4 border-b px-5 py-4 min-[44rem]:px-6">
                    <div className="min-w-0">
                        <h2
                            id={titleId}
                            className="text-theme-on-surface truncate text-lg font-semibold tracking-tight"
                        >
                            {template.name}
                        </h2>
                        <p className="text-theme-on-surface/60 mt-1 text-sm">
                            {template.description ||
                                `${template.category || 'General'} template`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Stat
                                icon="list_alt"
                                label={`${stats.questions} questions`}
                            />
                            <Stat
                                icon="layers"
                                label={`${stats.sections} ${stats.sections === 1 ? 'section' : 'sections'}`}
                            />
                            <Stat
                                icon="schedule"
                                label={`About ${stats.minutes} min`}
                            />
                            {stats.hasBranching && (
                                <Stat
                                    icon="alt_route"
                                    label="Smart branching"
                                />
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close preview"
                        className={cn(
                            'text-theme-on-surface/70 hover:bg-theme-surface-hover hover:text-theme-on-surface -mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50',
                            FOCUS_RING
                        )}
                    >
                        <span className="material-symbols-outlined text-xl">
                            close
                        </span>
                    </button>
                </div>

                {/* Live preview of the real questions */}
                <div className="bg-theme-on-surface/3 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 min-[44rem]:p-6">
                    <div className="bg-theme-surface border-theme-on-surface/10 mx-auto max-w-xl rounded-lg border p-5 shadow-xs">
                        <TemplatePreview template={template} />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-theme-on-surface/10 flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 min-[44rem]:flex-row min-[44rem]:items-center min-[44rem]:justify-between min-[44rem]:px-6">
                    <p className="text-theme-on-surface/55 text-xs">
                        Everything is editable after you use this template.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className={cn(
                                'text-theme-on-surface/75 hover:bg-theme-surface-hover hover:text-theme-on-surface rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                                FOCUS_RING
                            )}
                        >
                            Cancel
                        </button>
                        <button
                            ref={primaryRef}
                            type="button"
                            onClick={() => void onUse(template)}
                            disabled={busy || disabled}
                            aria-busy={busy}
                            className={cn(
                                'bg-brand text-on-brand inline-flex min-w-36 items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60',
                                FOCUS_RING
                            )}
                        >
                            {busy ? (
                                <>
                                    <span className="border-on-brand/30 border-t-on-brand h-4 w-4 rounded-full border-2 motion-safe:animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                'Use template'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
