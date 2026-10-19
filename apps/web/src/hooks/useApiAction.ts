import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '@/api/http';

export type ApiResponse<T> =
    { ok: true; data: T } | { ok: false; error: string; status?: number };

export function useApiAction<TArgs extends unknown[], TData>(
    apiCall: (...args: TArgs) => Promise<{ data: TData }>
) {
    const [loading, setLoading] = useState<boolean>(false);
    const apiCallRef = useRef(apiCall);

    useEffect(() => {
        apiCallRef.current = apiCall;
    }, [apiCall]);

    const execute = useCallback(
        async (...args: TArgs): Promise<ApiResponse<TData>> => {
            setLoading(true);
            try {
                const res = await apiCallRef.current(...args);
                return { ok: true, data: res.data };
            } catch (e: unknown) {
                const message =
                    e instanceof ApiError
                        ? e.message
                        : 'An unexpected error occurred.';
                // Callers that need to distinguish "session is gone" (401/403)
                // from a transient failure get the HTTP status here.
                return {
                    ok: false,
                    error: message,
                    status: e instanceof ApiError ? e.status : undefined,
                };
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { loading, execute };
}
