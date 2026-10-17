'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, http } from '@/api/http';
import { endpoints } from '@/api/endpoints';
import type { FillForm } from '../../types/fill.type';

export type SubmissionState = 'idle' | 'sending' | 'accepted' | 'failed';

export interface SubmitResult {
    state: SubmissionState;
    submissionId?: string;
    message?: string;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

        http.get<FillForm>(endpoints.forms.fill(formId), {
            signal: controller.signal,
        })
            .then((res) => {
                if (controller.signal.aborted) return;

                const form = res.data as unknown as FillForm;
                // A success with no payload would otherwise leave the view with
                // a null form and no reason to show.
                if (!form?.sections) {
                    throw new Error('This form has no content yet');
                }

                setResult({
                    formId,
                    form,
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

    /**
     * Stable per-form-session idempotency key. A fresh UUID per click would
     * make each double-click a distinct submission server-side; one key per
     * session lets the server collapse repeats. Rotated after a terminal
     * outcome so a deliberately new response gets a new key.
     */
    const idempotencyKeyRef = useRef('');

    useEffect(() => {
        cancelledRef.current = false;
        idempotencyKeyRef.current = '';

        return () => {
            cancelledRef.current = true;
        };
    }, [formId]);

    const poll = useCallback(
        async (submissionId: string) => {
            for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
                await sleep(POLL_INTERVAL_MS);

                if (cancelledRef.current) return;

                try {
                    const res = await http.get<{
                        status?: string;
                        submissionId: string;
                    }>(
                        endpoints.forms.submissionStatus(
                            formId as string,
                            submissionId
                        )
                    );

                    const status = res.data?.status;

                    // Worker states are 'pending' | 'processing' | 'done' |
                    // 'failed'; the extra spellings are tolerated in case the
                    // backend settles on them.
                    if (
                        status === 'done' ||
                        status === 'completed' ||
                        status === 'success'
                    ) {
                        // Terminal: the next intentional submit is a new
                        // response and needs its own key.
                        idempotencyKeyRef.current = '';
                        setState('accepted');
                        setMessage('Response recorded');
                        return;
                    }

                    if (status === 'failed' || status === 'error') {
                        idempotencyKeyRef.current = '';
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

            // Do not claim success after exhausting polls: the worker may
            // still be processing or may have failed silently.
            setState('failed');
            setMessage('Submission is still processing. Please check back later.');
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
                const answers = payload.map((p) => ({
                    questionId: p.questionId,
                    value: p.values,
                }));

                // Reuse the session key so a rapid double-click (or a retry
                // after a network error) maps to the same server-side
                // submission instead of creating a second response.
                if (!idempotencyKeyRef.current) {
                    idempotencyKeyRef.current = newIdempotencyKey();
                }

                const res = await http.post<{ submissionId: string }>(
                    endpoints.forms.submitFill(formId),
                    {
                        idempotencyKey: idempotencyKeyRef.current,
                        answers,
                        metadata: {
                            userAgent:
                                typeof navigator !== 'undefined'
                                    ? navigator.userAgent.slice(0, 500)
                                    : 'Unknown',
                            ipAddress: 'client',
                        },
                    }
                );

                const submissionId = res.data?.submissionId;

                if (!submissionId) {
                    throw new Error('Failed to submit');
                }

                setState('accepted');
                setMessage('Submission received. Confirming...');

                void poll(submissionId);

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
