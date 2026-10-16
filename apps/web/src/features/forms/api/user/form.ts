'use client';

import { useCallback, useRef } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import type { FormDB } from '@/types';

interface UseGetFormsProps {
    signal?: AbortSignal;
    page: number;
    limit: number;
}

interface FormsResponse {
    forms: FormDB[];
}

export default function useGetForms({
    signal,
    page: initialPage,
    limit,
}: Readonly<UseGetFormsProps>) {
    const page = useRef(initialPage);
    const hasMore = useRef(true);

    const { loading, execute } = useApiAction(async () => {
        if (!hasMore.current) {
            return { data: [] };
        }

        const response = await http.get<FormsResponse>(
            endpoints.forms.allForms(page.current, limit),
            { signal },
        );

        const forms = response.data.forms ?? [];

        hasMore.current = forms.length === limit;

        if (hasMore.current) {
            page.current += 1;
        }

        return { data: forms };
    });

    const next = useCallback(async () => {
        if (loading || !hasMore.current) return [];

        const response = await execute();

        if (!response.ok) {
            throw new Error(response.error);
        }

        return response.data;
    }, [execute, loading]);

    return { loading, next };
}
