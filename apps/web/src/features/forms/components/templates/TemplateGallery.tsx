'use client';

import {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useCreateForm from '@/features/forms/api/createForm';
import { useEnsureForm } from '@/features/forms/api/user/formSearch';
import {
    getRecentTemplateIds,
    rememberTemplate,
    useCloneTemplate,
    useTemplates,
    type TemplateSummary,
} from '@/features/forms/api/user/templates';
import formRepository from '@/features/forms/repositories/formRepository';
import { createDefaultForm } from '@/features/forms/utils/default';
import { useAuth } from '@/providers';
import { cn } from '@/utils/cn';
import TemplateCard from './TemplateCard';
import TemplateGalleryContent from './TemplateGalleryContent';
import { isFeatured, matchesTemplate } from './templateMeta';
import TemplatePreviewDialog from './TemplatePreviewDialog';
import TemplateHeader from './TemplateHeader';

const ALL = 'All';
const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

function BlankFormCard({
    busy,
    disabled,
    onCreate,
}: {
    busy: boolean;
    disabled: boolean;
    onCreate: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onCreate}
            disabled={busy || disabled}
            aria-busy={busy}
            className={cn(
                'group bg-theme-surface border-theme-form-container-border/60 relative z-0 flex w-full flex-col overflow-hidden rounded-md border text-left transition-[background-color,transform,opacity] duration-150 ease-out',
                FOCUS_RING,
                !busy &&
                    !disabled &&
                    'hover:bg-brand-light motion-safe:hover:z-10 motion-safe:hover:scale-[1.02]',
                disabled && !busy && 'pointer-events-none opacity-50'
            )}
        >
            <div className="relative w-full p-3">
                <div className="bg-theme-on-surface/3 flex h-full w-full items-center rounded-md transition-colors">
                    <span
                        className={cn(
                            'bg-brand-light text-on-brand-light flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                            !busy &&
                                'group-hover:bg-brand group-hover:text-on-brand'
                        )}
                    >
                        {busy ? (
                            <span className="border-on-brand-light/30 border-t-on-brand-light h-6 w-6 rounded-full border-2 motion-safe:animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-3xl">
                                add
                            </span>
                        )}
                    </span>
                </div>
            </div>

            <div className="px-4 pt-1 pb-3">
                <p className="text-theme-on-surface text-sm font-semibold">
                    Blank form
                </p>
                <p className="text-theme-on-surface/55 mt-0.5 text-xs">
                    Start from scratch
                </p>
            </div>
        </button>
    );
}

export default function TemplateGallery() {
    const router = useRouter();
    const { templates, error, retry } = useTemplates();
    const { cloneTemplate, cloningId } = useCloneTemplate();
    const { ensureForm } = useEnsureForm();
    const { createForm, loading: creatingForm } = useCreateForm();
    const { decodedToken } = useAuth();

    const [recentIds, setRecentIds] = useState<string[]>([]);
    const [creatingBlank, setCreatingBlank] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(ALL);
    const [query, setQuery] = useState('');
    const [previewTemplate, setPreviewTemplate] =
        useState<TemplateSummary | null>(null);
    const blankRef = useRef(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const search = useDeferredValue(query.trim());

    useEffect(() => {
        void Promise.resolve().then(() => setRecentIds(getRecentTemplateIds()));
    }, []);

    // Press "/" anywhere to jump to search.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key !== '/' ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            )
                return;
            const target = event.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            )
                return;

            event.preventDefault();
            if (previewTemplate) return;
            searchRef.current?.focus();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [previewTemplate]);

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

    const handleClone = useCallback(
        async (template: TemplateSummary) => {
            const cloned = await cloneTemplate(template.id);
            if (!cloned?.id) return;

            rememberTemplate(template.id);
            setRecentIds(getRecentTemplateIds());
            await openForm(cloned.id);
        },
        [cloneTemplate, openForm]
    );

    const handleBlankForm = useCallback(async () => {
        if (blankRef.current || creatingForm) return;

        blankRef.current = true;
        setCreatingBlank(true);

        try {
            const res = await createForm(createDefaultForm());

            if (!res.ok) {
                toast.error(res.error || 'Failed to create form');
                return;
            }

            if (!res.data?.id) {
                toast.error('Server did not return the new form. Try again.');
                return;
            }

            await formRepository.save({
                ...res.data,
                userId: res.data.userId ?? decodedToken?.userId ?? '',
            });

            window.location.href = `/forms/c/${res.data.id}`;
        } catch (cause) {
            toast.error(
                cause instanceof Error ? cause.message : 'Form creation failed'
            );
        } finally {
            blankRef.current = false;
            setCreatingBlank(false);
        }
    }, [createForm, creatingForm, decodedToken]);

    /** Templates matching the search box (all templates when it's empty). */
    const searched = useMemo(() => {
        if (!templates) return undefined;
        if (!search) return templates;
        return templates.filter((template) =>
            matchesTemplate(template, search)
        );
    }, [templates, search]);

    const categories = useMemo(() => {
        const groups = new Map<string, TemplateSummary[]>();

        for (const template of searched ?? []) {
            const key = template.category?.trim() || 'Other';
            const bucket = groups.get(key);

            if (bucket) bucket.push(template);
            else groups.set(key, [template]);
        }

        // Featured first inside every category; order is otherwise preserved.
        for (const bucket of groups.values()) {
            bucket.sort(
                (a, b) => Number(isFeatured(b)) - Number(isFeatured(a))
            );
        }

        return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [searched]);

    const visibleCategories = useMemo(
        () =>
            activeCategory === ALL
                ? categories
                : categories.filter(([name]) => name === activeCategory),
        [categories, activeCategory]
    );

    const filters = useMemo(
        () => [
            { name: ALL, count: searched?.length ?? 0 },
            ...categories.map(([name, items]) => ({
                name,
                count: items.length,
            })),
        ],
        [categories, searched]
    );

    const recentTemplates = useMemo(() => {
        if (!templates) return [];

        const byId = new Map(
            templates.map((template) => [template.id, template])
        );

        return recentIds
            .map((id) => byId.get(id))
            .filter((template): template is TemplateSummary =>
                Boolean(template)
            );
    }, [recentIds, templates]);

    const hasTemplates = Boolean(templates && templates.length > 0);

    const renderCard = (template: TemplateSummary) => (
        <TemplateCard
            key={template.id}
            template={template}
            onUse={handleClone}
            onPreview={setPreviewTemplate}
            cloning={cloningId === template.id}
            disabled={cloningId !== null && cloningId !== template.id}
        />
    );

    return (
        <main className="relative mx-auto h-full w-full max-w-7xl scrollbar-none overflow-y-hidden px-2 min-[44rem]:px-5">
            <TemplateHeader
                query={query}
                setQuery={setQuery}
                searchRef={searchRef}
                hasTemplates={hasTemplates}
            />

            <div
                className={
                    'grid h-[calc(100%-5rem)] min-h-0 grid-cols-1 gap-2 md:grid lg:grid lg:grid-cols-[13rem_1fr]'
                }
            >
                <aside className="sticky top-0 hidden min-h-0 lg:grid">
                    {hasTemplates && (
                        <nav
                            aria-label="Template categories"
                            className="sticky top-28 flex flex-col gap-0.5"
                        >
                            {filters.map(({ name, count }) => {
                                const active = name === activeCategory;

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setActiveCategory(name)}
                                        className={cn(
                                            'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                                            FOCUS_RING,
                                            active
                                                ? 'bg-brand-light text-on-brand-light font-medium'
                                                : 'text-theme-on-surface/70 hover:bg-theme-surface-hover hover:text-theme-on-surface'
                                        )}
                                    >
                                        <span className="truncate">{name}</span>
                                        <span className="text-xs tabular-nums opacity-60">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    )}
                </aside>

                <div className="h-full min-h-0 w-full flex-1">
                    {hasTemplates && (
                        <div
                            role="group"
                            aria-label="Filter templates by category"
                            className="my-3 flex scrollbar-none gap-2 overflow-x-auto lg:hidden"
                        >
                            {filters.map(({ name }) => {
                                const active = name === activeCategory;

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setActiveCategory(name)}
                                        className={cn(
                                            'shrink-0 rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors',
                                            FOCUS_RING,
                                            active
                                                ? 'bg-brand text-on-brand border-brand'
                                                : 'text-theme-on-surface/70 border-theme-on-surface/15 hover:bg-theme-surface-hover'
                                        )}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <div className="h-full min-h-0 w-full scrollbar-none overflow-y-auto px-2 pb-36">
                        <TemplateGalleryContent
                            error={error}
                            templates={templates}
                            search={search}
                            visibleCategories={visibleCategories}
                            recentTemplates={recentTemplates}
                            showStartRow={activeCategory === ALL && !search}
                            renderCard={renderCard}
                            onRetry={retry}
                            onCreateBlank={handleBlankForm}
                            onClearSearch={() => setQuery('')}
                            onShowAll={() => setActiveCategory(ALL)}
                        />
                    </div>
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
                    onUse={handleClone}
                />
            )}
        </main>
    );
}
