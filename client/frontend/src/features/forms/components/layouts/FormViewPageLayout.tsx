'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { pageTitle, useDocumentTitle } from '@/lib/useDocumentTitle';
import {
    DEFAULT_FORM_THEME,
    FORM_THEME_ATTR,
    FORM_THEMES,
    type FormThemeId,
} from '@/lib/formTheme';
import SectionView from '../view/SectionView';
import { useFillForm, useSubmitForm } from '../../api/user/fillForm';
import {
    toSubmissionPayload,
    validateSection,
} from '../../lib/fill-validation';
import type { FillSection } from '../../types/fill.type';

function Loading() {
    return (
        <div className="flex h-full w-full flex-col gap-4">
            <div className="bg-theme-form-on-surface/10 h-8 w-1/2 animate-pulse rounded-md" />
            <div className="bg-theme-form-on-surface/10 h-40 w-full animate-pulse rounded-md" />
            <div className="bg-theme-form-on-surface/10 h-24 w-full animate-pulse rounded-md" />
        </div>
    );
}

function Failure({ message }: Readonly<{ message: string }>) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-4xl opacity-40">
                error
            </span>
            <h1 className="text-lg font-semibold">Form unavailable</h1>
            <p className="text-theme-form-on-surface/70 max-w-sm text-sm">
                {message}
            </p>
        </div>
    );
}

function Done({ message }: Readonly<{ message?: string }>) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-5xl text-green-500">
                check_circle
            </span>
            <h1 className="text-xl font-semibold">Response recorded</h1>
            <p className="text-theme-form-on-surface/70 max-w-sm text-sm">
                {message ??
                    'Thanks for filling this form. Your answers have been saved.'}
            </p>
        </div>
    );
}

export default function FormViewPageLayout() {
    // The route segment is `[id]`, so that is the key `useParams` returns.
    const params = useParams<{ id?: string | string[] }>();

    const id = Array.isArray(params?.id)
        ? params.id[0]
        : (params?.id ?? undefined);

    const { form, loading, error } = useFillForm(id);
    const { state, message, submit } = useSubmitForm(id);

    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const topRef = useRef<HTMLDivElement>(null);

    useDocumentTitle(pageTitle(form?.form?.name));

    const sections: FillSection[] = useMemo(
        () => (form?.sections ?? []).slice().sort((a, b) => a.index - b.index),
        [form]
    );

    const answered = useMemo(() => {
        const sectionsWithAnswers = sections.map(
            (section) =>
                section.questions.filter((question) =>
                    (answers[question._id] ?? []).some((v) => v.trim())
                ).length
        );

        return sectionsWithAnswers.reduce((sum, n) => sum + n, 0);
    }, [answers, sections]);

    const total = useMemo(
        () => sections.reduce((sum, s) => sum + s.questions.length, 0),
        [sections]
    );

    const onChange = useCallback((questionId: string, values: string[]) => {
        setAnswers((prev) => ({ ...prev, [questionId]: values }));

        // Clear the error as soon as the answer changes so the message
        // does not linger while the user is fixing it.
        setErrors((prev) => {
            if (!prev[questionId]) return prev;

            const next = { ...prev };
            delete next[questionId];
            return next;
        });
    }, []);

    const scrollTop = useCallback(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!form) return;

        /**
         * Validate every section, not just the visible one. Submit is reachable
         * directly from the last section, so the per-section check that runs on
         * "Next" never happens first - without this a required question on the
         * final section could be submitted blank.
         */
        const nextErrors: Record<string, string> = {};
        let firstInvalid = -1;

        sections.forEach((section, index) => {
            const found = validateSection(section.questions, answers);

            if (Object.keys(found).length && firstInvalid === -1) {
                firstInvalid = index;
            }

            Object.assign(nextErrors, found);
        });

        if (firstInvalid !== -1) {
            setErrors(nextErrors);
            setCurrent(firstInvalid);
            scrollTop();
            toast.error('Please fix the highlighted questions');
            return;
        }

        setErrors({});

        // A form with no required questions may legitimately submit no answers.
        const payload = toSubmissionPayload(sections, answers);
        const result = await submit(payload);

        if (result.state === 'failed') {
            toast.error(result.message ?? 'Failed to submit your response');
        }
    }, [answers, form, scrollTop, sections, submit]);

    const goNext = useCallback(() => {
        const section = sections[current];

        if (!section) return;

        const found = validateSection(section.questions, answers);

        if (Object.keys(found).length) {
            setErrors(found);
            toast.error('Please fix the highlighted questions');
            return;
        }

        setErrors({});

        // A section may jump somewhere other than the next one.
        const action = section.defaultAction;

        if (action?.actionType === 'SUBMIT_FORM') {
            void handleSubmit();
            return;
        }

        if (action?.actionType === 'GO_TO_SECTION' && action.sectionId) {
            const target = sections.findIndex(
                (s) => s._id === action.sectionId
            );

            if (target >= 0) {
                setCurrent(target);
                scrollTop();
                return;
            }
        }

        setCurrent((prev) => Math.min(prev + 1, sections.length - 1));
        scrollTop();
    }, [answers, current, handleSubmit, scrollTop, sections]);

    const goBack = useCallback(() => {
        setErrors({});
        setCurrent((prev) => Math.max(prev - 1, 0));
        scrollTop();
    }, [scrollTop]);

    /*
     * The form carries its own theme, so it is scoped to this page rather than
     * applied to <html>: a respondent who has picked a theme of their own keeps
     * it everywhere else, and only sees the owner's colours while filling this
     * form in. The custom properties inherit, and Tailwind's utilities read
     * them directly, so a wrapper attribute is enough.
     *
     * `default` removes the attribute instead of setting it, so the base
     * :root palette applies rather than an unmatched selector.
     */
    /*
     * Pinned to the form's own theme, defaulting to `default` when the form has
     * none - it predates per-form themes, or the value is not one this build
     * offers. Leaving the attribute off would be wrong here: the page would
     * inherit whatever theme the *respondent* picked for themselves, so the
     * same form would look different to different people. `default` is a real
     * selector, so setting it pins the base palette.
     */
    const requested = form?.form?.theme;
    const formTheme: FormThemeId =
        requested && FORM_THEMES.some((theme) => theme.id === requested)
            ? requested
            : DEFAULT_FORM_THEME;

    const themeScope = {
        [FORM_THEME_ATTR]: formTheme,
    } as Record<string, string>;

    const themed = (children: React.ReactNode) => (
        <div
            {...themeScope}
            className="bg-theme-form-surface h-full w-full scrollbar-none overflow-y-auto"
        >
            {children}
        </div>
    );

    if (loading) return themed(<Loading />);

    if (error || !form) {
        return themed(
            <Failure
                message={
                    error ??
                    (id
                        ? 'This form could not be loaded.'
                        : 'No form was specified in the address.')
                }
            />
        );
    }

    if (state === 'accepted') return themed(<Done message={message} />);

    const section = sections[current];
    const isLast = current >= sections.length - 1;
    const percent = total ? Math.round((answered / total) * 100) : 0;

    return themed(
        <div ref={topRef} className="mx-auto w-full max-w-2xl px-6 py-10">
            <header className="mb-8 flex flex-col gap-2">
                <h1 className="text-theme-form-on-surface text-2xl font-bold">
                    {form.form.name || 'Untitled form'}
                </h1>
                <p className="text-theme-form-on-surface/60 text-sm">
                    Section {current + 1} of {sections.length} · {answered}/
                    {total} answered
                </p>
                <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="bg-theme-form-on-surface/10 mt-2 h-1.5 w-full overflow-hidden rounded-full"
                >
                    <div
                        className="bg-theme-form-container-active h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </header>

            {section ? (
                <SectionView
                    section={section}
                    answers={answers}
                    errors={errors}
                    onChange={onChange}
                />
            ) : (
                <p className="text-theme-form-on-surface/70 text-sm">
                    This form has no questions yet.
                </p>
            )}

            <footer className="mt-10 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={current === 0}
                    className="border-theme-form-on-surface/30 text-theme-form-on-surface hover:bg-theme-form-on-surface/5 rounded-md border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Back
                </button>

                <button
                    type="button"
                    onClick={isLast ? () => void handleSubmit() : goNext}
                    disabled={state === 'sending'}
                    className="bg-theme-form-container-active text-theme-form-on-active rounded-md px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-60"
                >
                    {state === 'sending'
                        ? 'Submitting…'
                        : isLast
                          ? 'Submit'
                          : 'Next'}
                </button>
            </footer>

            {state === 'failed' && message ? (
                <p
                    role="alert"
                    className="mt-4 text-right text-sm text-red-500"
                >
                    {message}
                </p>
            ) : null}
        </div>
    );
}
