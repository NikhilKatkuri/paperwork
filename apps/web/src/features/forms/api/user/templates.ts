'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import storageService from '@/providers/StorageService';
import type { FormDto, Template } from '@paperwork/types';

/** A template as returned by the API (`_id`) normalised to use `id`. */
export interface TemplateSummary extends Template {
    id: string;
}

type RawTemplate = Template & { id?: string; _id?: string };

const RECENTS_KEY = 'template-recents';
const RECENTS_MAX = 6;

function toSummary(raw: RawTemplate): TemplateSummary | null {
    const id = raw.id ?? raw._id;
    if (!id) return null;

    return {
        ...raw,
        id,
        sections: raw.sections ?? [],
        questions: raw.questions ?? [],
    };
}

/** Ids of the most recently used templates, newest first. */
export function getRecentTemplateIds(): string[] {
    const ids = storageService.get<string[]>(RECENTS_KEY, []);
    return Array.isArray(ids) ? ids : [];
}

/** Record template usage for the "Recently used" row on the gallery. */
export function rememberTemplate(templateId: string): void {
    const next = [
        templateId,
        ...getRecentTemplateIds().filter((id) => id !== templateId),
    ].slice(0, RECENTS_MAX);

    storageService.set(RECENTS_KEY, next);
}

/** Fetch every template, normalised and ready to group by category. */
export function useTemplates() {
    const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        http.get<RawTemplate[]>(endpoints.forms.allTemplates(), {
            signal: controller.signal,
        })
            .then((res) => {
                if (controller.signal.aborted) return;

                const list = (res.data ?? [])
                    .map(toSummary)
                    .filter((item): item is TemplateSummary => item !== null);

                setTemplates(list);
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) return;

                console.warn('[templates] could not load templates', cause);
                setError(
                    cause instanceof Error
                        ? cause.message
                        : 'Could not load templates'
                );
            });

        return () => controller.abort();
    }, [reloadKey]);

    const retry = useCallback(() => {
        setTemplates(null);
        setError(null);
        setReloadKey((key) => key + 1);
    }, []);

    return { templates, error, retry };
}

/**
 * Clone a template into a brand new form. Only one clone runs at a time;
 * `cloningId` drives the per-card spinner in the gallery.
 */
export function useCloneTemplate() {
    const [cloningId, setCloningId] = useState<string | null>(null);
    const busyRef = useRef(false);

    const cloneTemplate = useCallback(
        async (templateId: string): Promise<FormDto | null> => {
            if (busyRef.current) return null;

            busyRef.current = true;
            setCloningId(templateId);

            try {
                const res = await http.post<FormDto>(
                    endpoints.forms.cloneTemplate(templateId),
                    { data: {} }
                );
                return res.data;
            } catch (cause) {
                console.error('[templates] clone failed', cause);
                toast.error(
                    cause instanceof Error
                        ? cause.message
                        : 'Could not create the form from this template'
                );
                return null;
            } finally {
                busyRef.current = false;
                setCloningId(null);
            }
        },
        []
    );

    return { cloneTemplate, cloningId };
}
