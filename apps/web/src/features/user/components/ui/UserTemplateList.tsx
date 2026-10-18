'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useEnsureForm } from '@/features/forms/api/user/formSearch';
import {
    rememberTemplate,
    useCloneTemplate,
    useTemplates,
    type TemplateSummary,
} from '@/features/forms/api/user/templates';
import TemplateCard from '@/features/forms/components/templates/TemplateCard';
import TemplatePreviewDialog from '@/features/forms/components/templates/TemplatePreviewDialog';
import { cn } from '@/utils/cn';

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

const SKELETON_COUNT = 6;

function SkeletonCard() {
    return (
        <div className="border-theme-skeletion-surface w-72 shrink-0 rounded-md border p-4">
            <div className="flex items-center gap-2">
                <div className="bg-theme-skeletion-surface h-7 w-7 rounded-md motion-safe:animate-pulse" />
                <div className="bg-theme-skeletion-surface rounded-theme-skeletion-text h-3.5 w-32 motion-safe:animate-pulse" />
            </div>
            <div className="bg-theme-skeletion-surface rounded-theme-skeletion-text mt-4 h-3 w-44 motion-safe:animate-pulse" />
        </div>
    );
}

function NoticeCard({
    icon,
    message,
    actionLabel,
    onAction,
}: {
    icon: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="flex w-72 shrink-0 flex-col items-center justify-center gap-2 rounded-md bg-white p-6 text-center">
            <span className="material-symbols-outlined text-theme-on-surface/40 text-3xl">
                {icon}
            </span>
            <p className="text-theme-on-surface/70 text-xs">{message}</p>
            <button
                type="button"
                onClick={onAction}
                className={cn(
                    'text-brand hover:bg-brand-light hover:text-on-brand-light mt-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    FOCUS_RING
                )}
            >
                {actionLabel}
            </button>
        </div>
    );
}

/**
 * Featured templates strip for the user home page.
 *
 * Only templates flagged `isFeatured` reach this row; the full catalogue
 * lives behind "More templates" on the gallery page. Cards are the same
 * `TemplateCard` used by the gallery, preview dialog included.
 */
export default function UserTemplateList() {
    const router = useRouter();
    const { templates, error, retry } = useTemplates();
    const { cloneTemplate, cloningId } = useCloneTemplate();
    const { ensureForm } = useEnsureForm();

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [previewTemplate, setPreviewTemplate] =
        useState<TemplateSummary | null>(null);

    const featured = useMemo(
        () => (templates ?? []).filter((template) => template.isFeatured),
        [templates]
    );

    const loading = templates === null && !error;

    const updateScrollButtons = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 0);

        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        updateScrollButtons();

        const el = scrollContainerRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollButtons, { passive: true });
        window.addEventListener('resize', updateScrollButtons);

        return () => {
            el.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [updateScrollButtons, featured.length, loading]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (!el) return;

        el.scrollBy({
            left: direction === 'left' ? -300 : 300,
            behavior: 'smooth',
        });
    };

    const openForm = useCallback(
        async (formId: string) => {
            const ready = await ensureForm(formId);

            if (!ready) {
                toast.error(
                    'The form was created, but could not be opened. Find it on your home page.'
                );
                router.push('/user');
                return;
            }

            window.location.href = `/forms/c/${formId}`;
        },
        [ensureForm, router]
    );

    const handleUse = useCallback(
        async (template: TemplateSummary) => {
            const cloned = await cloneTemplate(template.id);
            if (!cloned?.id) return;

            rememberTemplate(template.id);
            await openForm(cloned.id);
        },
        [cloneTemplate, openForm]
    );

    return (
        <>
            <div className="mb-4 overflow-hidden rounded-md">
                <div className="group bg-brand-light/40 relative w-full rounded-md">
                    {/* Left button */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="bg-theme-form-container-active text-on-brand-depth absolute top-1/2 left-2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-200 group-hover:flex focus:outline-none"
                            aria-label="Scroll Left"
                        >
                            <span className="material-symbols-outlined text-3xl">
                                chevron_left
                            </span>
                        </button>
                    )}

                    <div className="flex w-full rounded-md p-4">
                        <div
                            ref={scrollContainerRef}
                            className="flex w-full scrollbar-none gap-4 overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {loading &&
                                Array.from({ length: SKELETON_COUNT }).map(
                                    (_, index) => <SkeletonCard key={index} />
                                )}

                            {!loading && !error && featured.length === 0 && (
                                <NoticeCard
                                    icon="auto_awesome"
                                    message="No featured templates yet."
                                    actionLabel="Browse templates"
                                    onAction={() =>
                                        router.push('/forms/templates')
                                    }
                                />
                            )}

                            {!loading &&
                                error !== null &&
                                featured.length === 0 && (
                                    <NoticeCard
                                        icon="cloud_off"
                                        message={error}
                                        actionLabel="Try again"
                                        onAction={retry}
                                    />
                                )}

                            {featured.map((template) => (
                                <div
                                    key={template.id}
                                    className="w-72 shrink-0 [&>div]:h-full"
                                >
                                    <TemplateCard
                                        className="bg-white/50 hover:bg-white"
                                        template={template}
                                        onUse={handleUse}
                                        onPreview={setPreviewTemplate}
                                        cloning={cloningId === template.id}
                                        showFeaturedLabel={false}
                                        disabled={
                                            cloningId !== null &&
                                            cloningId !== template.id
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right button */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="bg-theme-form-container-active text-on-brand-depth absolute top-1/2 right-2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-200 group-hover:flex focus:outline-none"
                            aria-label="Scroll Right"
                        >
                            <span className="material-symbols-outlined text-3xl">
                                chevron_right
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {previewTemplate && (
                <TemplatePreviewDialog
                    template={previewTemplate}
                    busy={cloningId === previewTemplate.id}
                    disabled={
                        cloningId !== null && cloningId !== previewTemplate.id
                    }
                    onClose={() => setPreviewTemplate(null)}
                    onUse={handleUse}
                />
            )}
        </>
    );
}
