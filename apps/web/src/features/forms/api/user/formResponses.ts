'use client';

import { useEffect, useState } from 'react';
import { ApiError, http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import type { FormResponseDto } from '@paperwork/types';

export interface ResponsePagination {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}

export interface SummaryValue {
    value: string;
    count: number;
}

export interface SummaryEntry {
    questionId: string;
    answered: number;
    values: SummaryValue[];
}

export interface ResponseSummary {
    totalResponses: number;
    questions: SummaryEntry[];
}

export interface ResponseFilters {
    q?: string;
    questionId?: string;
    sort?: 'newest' | 'oldest';
}

type Status = 'loading' | 'ready' | 'error';

interface ListState {
    key: string;
    status: Status;
    responses: FormResponseDto[];
    pagination: ResponsePagination | null;
    error: string | null;
}

const IDLE: ListState = {
    key: '',
    status: 'loading',
    responses: [],
    pagination: null,
    error: null,
};

const EMPTY_PAGINATION: ResponsePagination = {
    currentPage: 1,
    totalPages: 0,
    total: 0,
    limit: 20,
};

/**
 * One page of responses, filtered and sorted server-side.
 *
 * State is tagged with a request key and compared during render, so changing a
 * filter or page shows a loading state without setting state inside the effect
 * body.
 */
export function useFormResponses(
    formId: string | undefined,
    page: number,
    limit: number,
    filters: ResponseFilters
) {
    const { q, questionId, sort } = filters;
    const key = `${formId ?? ''}:${page}:${limit}:${q ?? ''}:${questionId ?? ''}:${sort ?? 'newest'}`;
    const [state, setState] = useState<ListState>(IDLE);

    useEffect(() => {
        // Nothing to fetch - the panel renders its own empty state, and this
        // avoids a synchronous setState in the effect body.
        if (!formId) return;

        const controller = new AbortController();

        http.get<FormResponseDto[]>(
            endpoints.forms.formResponses(formId, {
                page,
                limit,
                q,
                questionId,
                sort,
            }),
            { signal: controller.signal }
        )
            .then((res) => {
                if (controller.signal.aborted) return;

                const raw = res.raw as
                    | { pagination?: ResponsePagination }
                    | undefined;

                setState({
                    key,
                    status: 'ready',
                    responses: Array.isArray(res.data) ? res.data : [],
                    pagination: raw?.pagination ?? EMPTY_PAGINATION,
                    error: null,
                });
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;

                setState({
                    key,
                    status: 'error',
                    responses: [],
                    pagination: null,
                    error:
                        e instanceof ApiError || e instanceof Error
                            ? e.message
                            : 'Failed to load responses',
                });
            });

        return () => controller.abort();
    }, [formId, key, limit, page, q, questionId, sort]);

    const current = state.key === key ? state : IDLE;

    return {
        responses: current.responses,
        pagination: current.pagination,
        loading: current.status === 'loading',
        error: current.error,
        retryKey: key,
    };
}

/** Per-question totals across every matching response, not just one page. */
export function useResponseSummary(
    formId: string | undefined,
    filters: ResponseFilters
) {
    const { q, questionId } = filters;
    const key = `${formId ?? ''}:${q ?? ''}:${questionId ?? ''}`;
    const [state, setState] = useState<{
        key: string;
        loading: boolean;
        summary: ResponseSummary | null;
        error: string | null;
    }>({ key: '', loading: true, summary: null, error: null });

    useEffect(() => {
        if (!formId) return;

        const controller = new AbortController();

        http.get<ResponseSummary>(
            endpoints.forms.formResponsesSummary(formId, {
                q,
                questionId,
            }),
            { signal: controller.signal }
        )
            .then((res) => {
                if (controller.signal.aborted) return;

                setState({
                    key,
                    loading: false,
                    summary: res.data ?? null,
                    error: null,
                });
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;

                setState({
                    key,
                    loading: false,
                    summary: null,
                    error:
                        e instanceof Error
                            ? e.message
                            : 'Failed to load summary',
                });
            });

        return () => controller.abort();
    }, [formId, key, q, questionId]);

    const current = state.key === key ? state : null;

    return {
        summary: current?.summary ?? null,
        loading: current ? current.loading : true,
        error: current?.error ?? null,
    };
}

/** Fetch every matching response across pages (Individual tab). */
const INDIVIDUAL_PAGE_LIMIT = 100;
const INDIVIDUAL_MAX_PAGES = 20;

export function useAllResponses(
    formId: string | undefined,
    filters: ResponseFilters
) {
    const { q, questionId, sort } = filters;
    const key = `${formId ?? ''}:${q ?? ''}:${questionId ?? ''}:${sort ?? 'newest'}`;
    const [state, setState] = useState<{
        key: string;
        loading: boolean;
        responses: FormResponseDto[];
        total: number;
        truncated: boolean;
        error: string | null;
    }>({ key: '', loading: true, responses: [], total: 0, truncated: false, error: null });

    useEffect(() => {
        if (!formId) return;

        const controller = new AbortController();
        let cancelled = false;

        (async () => {
            try {
                const all: FormResponseDto[] = [];
                let total = 0;
                let truncated = false;

                for (let page = 1; page <= INDIVIDUAL_MAX_PAGES; page++) {
                    if (cancelled) return;
                    const res = await http.get<FormResponseDto[]>(
                        endpoints.forms.formResponses(formId, {
                            page,
                            limit: INDIVIDUAL_PAGE_LIMIT,
                            q,
                            questionId,
                            sort,
                        }),
                        { signal: controller.signal }
                    );
                    if (cancelled) return;
                    const raw = res.raw as
                        | { pagination?: ResponsePagination }
                        | undefined;
                    total = raw?.pagination?.total ?? all.length + (Array.isArray(res.data) ? res.data.length : 0);
                    if (Array.isArray(res.data)) all.push(...res.data);
                    const totalPages = raw?.pagination?.totalPages ?? page;
                    if (page >= totalPages) break;
                    if (page === INDIVIDUAL_MAX_PAGES) truncated = true;
                }

                if (cancelled) return;
                setState({ key, loading: false, responses: all, total, truncated, error: null });
            } catch (e: unknown) {
                if (cancelled || controller.signal.aborted) return;
                setState({
                    key,
                    loading: false,
                    responses: [],
                    total: 0,
                    truncated: false,
                    error:
                        e instanceof ApiError || e instanceof Error
                            ? e.message
                            : 'Failed to load responses',
                });
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [formId, key, q, questionId, sort]);

    const current = state.key === key ? state : null;

    return {
        responses: current?.responses ?? [],
        total: current?.total ?? 0,
        truncated: current?.truncated ?? false,
        loading: current ? current.loading : true,
        error: current?.error ?? null,
    };
}

/** Download the filtered responses as a CSV file. */
export async function downloadResponsesCsv(
    formId: string,
    filters: ResponseFilters
): Promise<void> {
    const blob = await http.getBlob(
        endpoints.forms.exportResponsesCsv(formId, {
            q: filters.q,
            questionId: filters.questionId,
        })
    );

    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `responses-${formId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

export const RESPONSE_PAGE_SIZES = [10, 20, 50] as const;
