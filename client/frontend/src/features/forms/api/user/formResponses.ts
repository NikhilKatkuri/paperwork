'use client';

import { useEffect, useState } from 'react';
import { ApiError, http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import type {
    FormResponse,
    ResponsePagination,
    ResponseSummary,
} from '../../types/response.type';

interface ResponsesResponse {
    success: boolean;
    message: string;
    data: FormResponse[] | null;
    pagination?: ResponsePagination;
}

interface SummaryResponse {
    success: boolean;
    message: string;
    data: ResponseSummary;
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
    responses: FormResponse[];
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

        http.get<ResponsesResponse>(
            endpoints.forms.formResponses(formId, {
                page,
                limit,
                q,
                questionId,
                sort,
            }).path,
            { signal: controller.signal }
        )
            .then((res) => {
                if (controller.signal.aborted) return;

                if (!res.data.success) {
                    throw new Error(res.data.message || 'Failed to load');
                }

                setState({
                    key,
                    status: 'ready',
                    responses: Array.isArray(res.data.data)
                        ? res.data.data
                        : [],
                    pagination: res.data.pagination ?? null,
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

        http.get<SummaryResponse>(
            endpoints.forms.formResponsesSummary(formId, {
                q,
                questionId,
            }).path,
            { signal: controller.signal }
        )
            .then((res) => {
                if (controller.signal.aborted) return;

                if (!res.data.success) {
                    throw new Error(
                        res.data.message || 'Failed to load summary'
                    );
                }

                setState({
                    key,
                    loading: false,
                    summary: res.data.data,
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

export const RESPONSE_PAGE_SIZES = [10, 20, 50] as const;
