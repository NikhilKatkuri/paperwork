'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import type { FillForm } from '../../types/fill.type';

interface FillResponse {
    success: boolean;
    message: string;
    data: FillForm;
}

interface SubmitResponse {
    success: boolean;
    message: string;
    data: { submissionId: string };
}

interface StatusResponse {
    success: boolean;
    data: { status?: string; submissionId: string };
}

export type SubmissionState = 'idle' | 'sending' | 'accepted' | 'failed';

export interface SubmitResult {
    state: SubmissionState;
    submissionId?: string;
    message?: string;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Load a form for filling.
 *
 * Aborts on unmount rather than only ignoring the result - under StrictMode the
 * effect runs twice, and suppressing the second call would leave the first
 * response discarded with nothing to replace it.
 */
export function useFillForm(formId: string | undefined) {
    const [result, setResult] = useState<{
        formId: string | undefined;
        form: FillForm | null;
        error: string | null;
    }>({ formId: undefined, form: null, error: null });

    useEffect(() => {
        if (!formId) return;

        const controller = new AbortController();

        http.get<FillResponse>(endpoints.forms.fill(formId).path, {
            signal: controller.signal,
        })
            .then((res) => {
                if (controller.signal.aborted) return;

                if (!res.data.success) {
                    throw new Error(res.data.message || 'Failed to load form');
                }

                // A success with no payload would otherwise leave the view with
                // a null form and no reason to show.
                if (!res.data.data?.sections) {
                    throw new Error('This form has no content yet');
                }

                setResult({
                    formId,
                    form: res.data.data,
                    error: null,
                });
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;

                setResult({
                    formId,
                    form: null,
                    error:
                        e instanceof ApiError || e instanceof Error
                            ? e.message
                            : 'Failed to load form',
                });
            });

        return () => controller.abort();
    }, [formId]);

    // Derived during render so switching ids shows a loading state immediately
    // without setting state from inside the effect.
    const isCurrent = result.formId === formId;

    return {
        form: isCurrent ? result.form : null,
        loading: Boolean(formId) && !isCurrent,
        error: isCurrent ? result.error : null,
    };
}

/**
 * Submit answers and follow the submission status.
 *
 * The endpoint answers 202 and processes asynchronously, so the returned
 * submissionId is polled until it settles or the attempts run out.
 */
export function useSubmitForm(formId: string | undefined) {
    const [state, setState] = useState<SubmissionState>('idle');
    const [message, setMessage] = useState<string | undefined>();

    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;

        return () => {
            cancelledRef.current = true;
        };
    }, []);

    const poll = useCallback(
        async (submissionId: string) => {
            for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
                await sleep(POLL_INTERVAL_MS);

                if (cancelledRef.current) return;

                try {
                    const res = await http.get<StatusResponse>(
                        endpoints.forms.submissionStatus(
                            formId as string,
                            submissionId
                        ).path
                    );

                    const status = res.data?.data?.status;

                    // Worker states are 'pending' | 'processing' | 'done' |
                    // 'failed'; the extra spellings are tolerated in case the
                    // backend settles on them.
                    if (
                        status === 'done' ||
                        status === 'completed' ||
                        status === 'success'
                    ) {
                        setState('accepted');
                        setMessage('Response recorded');
                        return;
                    }

                    if (status === 'failed' || status === 'error') {
                        setState('failed');
                        setMessage('Your response could not be recorded');
                        return;
                    }
                } catch {
                    // The submission is already queued server-side, so a failed
                    // poll is not a failed submission - keep trying.
                }
            }

            if (cancelledRef.current) return;

            setState('accepted');
            setMessage('Response recorded');
        },
        [formId]
    );

    const submit = useCallback(
        async (
            payload: { questionId: string; values: string[] }[]
        ): Promise<SubmitResult> => {
            if (!formId) {
                return { state: 'failed', message: 'No form selected' };
            }

            setState('sending');
            setMessage(undefined);

            try {
                const res = await http.post<SubmitResponse>(
                    endpoints.forms.submitFill(formId).path,
                    { data: payload }
                );

                if (!res.data.success) {
                    throw new Error(res.data.message || 'Failed to submit');
                }

                setState('accepted');
                setMessage('Response recorded');

                const submissionId = res.data.data?.submissionId;

                if (submissionId) void poll(submissionId);

                return { state: 'accepted', submissionId };
            } catch (e) {
                const failure = {
                    state: 'failed' as const,
                    message:
                        e instanceof Error
                            ? e.message
                            : 'Failed to submit your response',
                };

                setState(failure.state);
                setMessage(failure.message);

                return failure;
            }
        },
        [formId, poll]
    );

    return { state, message, submit };
}
