'use client';

import { useCallback, useEffect, useState } from 'react';
import { http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import storageService from '@/providers/StorageService';
import formRepository from '../../repositories/formRepository';
import { FormDB } from '@/lib/db';

/** A search hit carries only what a result row needs. */
export interface FormSearchHit {
    _id: string;
    name: string;
}

interface SearchResponse {
    success: boolean;
    message: string;
    data: { forms: FormSearchHit[] };
}

interface FormResponse {
    success: boolean;
    message: string;
    data: {
        form: Partial<FormDB> & { _id: string };
        sections: FormDB['sections'];
        questions: (FormDB['questions'][number] & { sectionId?: string })[];
    };
}

/** Below this length a query is too broad to be worth running at all. */
const MIN_TERM = 2;
/**
 * Only bother the network once the term is this long. A one-character miss is
 * almost always a cache gap or a typo, and the local list will fill in.
 */
const NETWORK_FALLBACK_MIN = 3;
/** Repeat hits for a term are served from here instead of re-querying. */
const HIT_CACHE_MINUTES = 30;

const hitCacheKey = (term: string) => `formsearch:${term.toLowerCase()}`;

type Pass = { term: string; hits: FormSearchHit[] };

const EMPTY: Pass = { term: '', hits: [] };

/**
 * Typeahead over form names, local-first.
 *
 * The forms list already seeds every form into IndexedDB, so a query is usually
 * answered with no network at all. The server is consulted only when the local
 * scan finds nothing for a term long enough to be meaningful, and those results
 * are memoised so a repeat query is free too.
 *
 * `query` is expected to be debounced by the caller.
 */
export function useFormSearch(query: string) {
    const term = query.trim();

    const [local, setLocal] = useState<Pass>(EMPTY);
    const [remote, setRemote] = useState<Pass>(EMPTY);

    // Pass 1 - IndexedDB. Async, so no synchronous setState in the effect body.
    useEffect(() => {
        if (term.length < MIN_TERM) return;

        let alive = true;

        formRepository
            .searchLocal(term)
            .then((hits) => {
                if (alive) setLocal({ term, hits });
            })
            .catch((error: unknown) => {
                console.warn('[search] local scan failed', error);
                if (alive) setLocal({ term, hits: [] });
            });

        return () => {
            alive = false;
        };
    }, [term]);

    const localHits =
        local.term === term && term.length >= MIN_TERM ? local.hits : null;

    const needsRemote =
        term.length >= NETWORK_FALLBACK_MIN &&
        localHits !== null &&
        !localHits.length;

    // Pass 2 - server fallback.
    useEffect(() => {
        if (!needsRemote) return;

        const controller = new AbortController();

        /**
         * The cache read is deferred through a promise so that no state is set
         * synchronously in the effect body.
         */
        void Promise.resolve()
            .then(() => storageService.get<FormSearchHit[]>(hitCacheKey(term)))
            .then((cached) => {
                if (controller.signal.aborted) return;
                if (cached) {
                    setRemote({ term, hits: cached });
                    return;
                }

                return http
                    .get<SearchResponse>(
                        endpoints.forms.searchForms(term).path,
                        { signal: controller.signal }
                    )
                    .then((res) => {
                        if (controller.signal.aborted) return;

                        if (!res.data.success) {
                            throw new Error(
                                res.data.message || 'Search failed'
                            );
                        }

                        const hits = res.data.data?.forms ?? [];

                        storageService.set(
                            hitCacheKey(term),
                            hits,
                            HIT_CACHE_MINUTES
                        );
                        setRemote({ term, hits });
                    });
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;

                console.warn('[search] server fallback failed', e);
                setRemote({ term, hits: [] });
            });

        return () => controller.abort();
    }, [needsRemote, term]);

    const remoteHits = remote.term === term ? remote.hits : null;

    const hits = localHits?.length ? localHits : (remoteHits ?? EMPTY.hits);

    const searching = term.length >= MIN_TERM;
    const loading =
        searching &&
        (localHits === null || (needsRemote && remoteHits === null));

    return { hits, loading };
}

/**
 * Ensure a form is in the local cache, fetching it only when needed, so the
 * editor never mounts against an empty record.
 *
 * Returns false when the form could not be loaded.
 */
export function useEnsureForm() {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const ensureForm = useCallback(async (formId: string): Promise<boolean> => {
        try {
            const cached = await formRepository.get(formId);

            // Already cached with no unsynced edits - nothing to fetch.
            if (cached && !cached.isDirty) return true;
        } catch (error) {
            console.warn('[search] local lookup failed', error);
        }

        setLoadingId(formId);

        try {
            const res = await http.get<FormResponse>(
                endpoints.forms.formById(formId).path
            );

            if (!res.data.success) {
                throw new Error(res.data.message || 'Failed to load form');
            }

            const { form, sections, questions } = res.data.data;

            const sectionIndexById = new Map(
                sections.map((section) => [section._id, section.index])
            );

            const hydrated: FormDB = {
                ...(form as FormDB),
                sections,
                questions: questions.map((question) => {
                    const { sectionId, ...rest } = question;

                    return {
                        ...rest,
                        sectionIdx:
                            question.sectionIdx ??
                            (sectionId
                                ? (sectionIndexById.get(sectionId) ?? 0)
                                : 0),
                    };
                }),
            };

            /**
             * `seed` leaves a record with unsynced local edits alone, so opening
             * a form never discards work that has not reached the server.
             */
            await formRepository.seed(hydrated);

            return true;
        } catch (e) {
            console.error('[search] could not load form', e);

            return false;
        } finally {
            setLoadingId(null);
        }
    }, []);

    return { ensureForm, loadingId };
}
