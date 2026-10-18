'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
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
import { FillSection } from '../../types/fill.type';
import type { SectionAction } from '@paperwork/types';
import { QuestionTypeEnum } from '@paperwork/types';

function Loading() {
    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
            <div className="bg-theme-form-on-surface/10 h-8 w-1/2 animate-pulse rounded-md" />
            <div className="bg-theme-form-on-surface/10 h-40 w-full animate-pulse rounded-md" />
            <div className="bg-theme-form-on-surface/10 h-24 w-full animate-pulse rounded-md" />
        </div>
    );
}

function Failure({ message }: Readonly<{ message: string }>) {
    return (
        <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 px-4 text-center">
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
        <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 px-4 text-center">
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

function getStatus(state: string, isLast: boolean) {
    if (state === 'sending') return 'Submitting…';

    return isLast ? 'Submit' : 'Next';
}

type NavTarget = { kind: 'section'; index: number } | { kind: 'submit' };

/** Evaluate one section rule against the current answers. */
function matchRule(
    operator: string,
    values: string[] | undefined,
    expected: unknown
): boolean {
    const vals = (values ?? []).map((v) => v.trim()).filter(Boolean);
    // An unanswered question matches nothing — fall through to default.
    if (!vals.length) return false;
    const exp = String(expected ?? '');

    switch (operator) {
        case 'EQUALS':
            return vals.some((v) => v === exp);
        case 'NOT_EQUALS':
            return vals.every((v) => v !== exp);
        case 'CONTAINS':
            return vals.some((v) =>
                v.toLowerCase().includes(exp.toLowerCase())
            );
        case 'GREATER_THAN': {
            const n = Number(vals[0]);
            return !Number.isNaN(n) && n > Number(exp);
        }
        case 'LESS_THAN': {
            const n = Number(vals[0]);
            return !Number.isNaN(n) && n < Number(exp);
        }
        default:
            return false;
    }
}

/**
 * Map an action to a navigation target. Returns null when the action is
 * absent, NEXT_SECTION (caller default), dangling (unknown section id) or
 * self-referential — all fall through to the next step.
 */
function applyAction(
    action: SectionAction | undefined,
    sections: FillSection[],
    current: number
): NavTarget | null {
    if (!action || action.type === 'NEXT_SECTION') return null;
    if (action.type === 'SUBMIT_FORM') return { kind: 'submit' };
    if (action.type === 'GO_TO_SECTION' && action.targetSectionId) {
        const target = sections.findIndex(
            (s) => s._id === action.targetSectionId
        );
        if (target >= 0 && target !== current) {
            return { kind: 'section', index: target };
        }
    }
    return null;
}

/**
 * Where "Next" goes from a section. Precedence:
 * 1. per-option actions of single-choice (RADIO / DROP_DOWN) answers in
 *    this section — "go to section based on answer";
 * 2. the section's rules[] — first matching rule wins;
 * 3. the section's defaultAction, else the next section in order.
 */
function resolveNavigation(
    section: FillSection,
    sections: FillSection[],
    current: number,
    answers: Record<string, string[]>
): NavTarget {
    for (const question of section.questions) {
        if (
            question.type !== QuestionTypeEnum.RADIO &&
            question.type !== QuestionTypeEnum.DROP_DOWN
        ) {
            continue;
        }
        const selected = (answers[question._id] ?? [])[0]?.trim();
        if (!selected) continue;
        const option = question.optionsConfig?.options.find(
            (o) => o.label === selected
        );
        const hit = applyAction(option?.action, sections, current);
        if (hit) return hit;
    }

    for (const rule of section.rules ?? []) {
        if (
            matchRule(rule.operator, answers[rule.questionId], rule.expectedValue)
        ) {
            const hit = applyAction(rule.action, sections, current);
            if (hit) return hit;
        }
    }

    return (
        applyAction(section.defaultAction, sections, current) ?? {
            kind: 'section',
            index: Math.min(current + 1, sections.length - 1),
        }
    );
}

export default function FormViewPageLayout() {
    const params = useParams<{ id?: string | string[] }>();

    const id = Array.isArray(params?.id)
        ? params.id[0]
        : (params?.id ?? undefined);

    const { form, loading, error } = useFillForm(id);
    const { state, message, submit } = useSubmitForm(id);

    const confirmationMessage =
        form?.form?.settings?.customConfirmationMessage?.trim() || undefined;
    const redirectUrl = form?.form?.settings?.redirectUrl?.trim() || undefined;

    const [current, setCurrent] = useState(0);
    /** Sections visited before `current`, so Back follows the path actually taken. */
    const [history, setHistory] = useState<number[]>([]);
    /** Every section ever shown — submit validates these, never skipped ones. */
    const [visited, setVisited] = useState<number[]>([0]);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    /** The single scroll container for the whole page. */
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToErrorRef = useRef(false);

    useDocumentTitle(pageTitle(form?.form?.name));

    const sections: FillSection[] = useMemo(
        () => (form?.sections ?? []).slice().sort((a, b) => a.index - b.index),
        [form]
    );

    const answered = useMemo(
        () =>
            sections.reduce(
                (sum, section) =>
                    sum +
                    section.questions.filter((question) =>
                        (answers[question._id] ?? []).some((v) =>
                            String(v).trim()
                        )
                    ).length,
                0
            ),
        [answers, sections]
    );

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

    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    /**
     * After a failed validation, bring the first invalid question into view.
     * Runs in an effect so it fires after React has rendered the target
     * section (validation can switch sections first).
     *
     * SectionView should put `data-question-id={question._id}` on each question
     * card; text inputs are also matched by their `q-<id>-…` id as a fallback.
     */
    useEffect(() => {
        if (!scrollToErrorRef.current) return;

        scrollToErrorRef.current = false;

        const first = Object.keys(errors)[0];
        const root = scrollRef.current;

        if (!first || !root) return;

        const key = CSS.escape(first);
        const target =
            root.querySelector(`[data-question-id="${key}"]`) ??
            root.querySelector(`[id^="q-${key}-"]`);

        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [errors, current]);

    /**
     * Owner-configured post-submit redirect. Only http(s) targets are
     * followed — the URL comes from the form document, not the respondent.
     * `replace` keeps the just-submitted form out of the back-button history.
     */
    useEffect(() => {
        if (state !== 'accepted' || !redirectUrl) return;

        try {
            const target = new URL(redirectUrl);

            if (target.protocol === 'http:' || target.protocol === 'https:') {
                window.location.replace(target.toString());
            }
        } catch {
            // Malformed URL — keep the confirmation screen instead.
        }
    }, [state, redirectUrl]);

    const failValidation = useCallback((next: Record<string, string>) => {
        scrollToErrorRef.current = true;
        setErrors(next);
        toast.error('Please fix the highlighted questions');
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!form) return;

        /**
         * Validate visited sections only — conditional navigation may skip
         * sections (e.g. a complaint section), and required questions in a
         * section the respondent never saw must not block submit.
         */
        const visible = [...new Set([...visited, current])]
            .map((i) => sections[i])
            .filter(Boolean);
        const nextErrors: Record<string, string> = {};
        let firstInvalid = -1;

        visible.forEach((section) => {
            const found = validateSection(section.questions, answers);

            if (Object.keys(found).length && firstInvalid === -1) {
                firstInvalid = sections.indexOf(section);
            }

            Object.assign(nextErrors, found);
        });

        if (firstInvalid !== -1) {
            if (firstInvalid !== current) {
                setHistory((prev) => [...prev, current]);
                setCurrent(firstInvalid);
            }

            failValidation(nextErrors);
            return;
        }

        setErrors({});

        // A form with no required questions may legitimately submit no answers.
        const payload = toSubmissionPayload(sections, answers);
        const result = await submit(payload);

        if (result.state === 'failed') {
            toast.error(result.message ?? 'Failed to submit your response');
        }
    }, [answers, current, failValidation, form, sections, submit, visited]);

    const goTo = useCallback(
        (target: number) => {
            setHistory((prev) => [...prev, current]);
            setVisited((prev) =>
                prev.includes(target) ? prev : [...prev, target]
            );
            setCurrent(target);
            scrollToTop();
        },
        [current, scrollToTop]
    );

    const goNext = useCallback(() => {
        const section = sections[current];

        if (!section) return;

        const found = validateSection(section.questions, answers);

        if (Object.keys(found).length) {
            failValidation(found);
            return;
        }

        setErrors({});

        // Conditional navigation: per-option actions, then section rules,
        // then the default action — instead of always the next section.
        const target = resolveNavigation(section, sections, current, answers);

        if (target.kind === 'submit') {
            void handleSubmit();
            return;
        }

        goTo(target.index);
    }, [answers, current, failValidation, goTo, handleSubmit, sections]);

    const goBack = useCallback(() => {
        setErrors({});
        setHistory((prev) => {
            if (!prev.length) return prev;

            setCurrent(prev[prev.length - 1]);
            return prev.slice(0, -1);
        });
        scrollToTop();
    }, [scrollToTop]);

    /*
     * The form carries its own theme, scoped to this page rather than applied
     * to <html>, so a respondent's own theme is untouched everywhere else.
     *
     * Always pin an explicit theme (falling back to `default`) instead of
     * omitting the attribute: otherwise the page would inherit whatever theme
     * the respondent picked, and the same form would look different to
     * different people.
     */
    const requested = form?.form?.theme;
    const formTheme: FormThemeId =
        requested && FORM_THEMES.some((theme) => theme.id === requested)
            ? requested
            : DEFAULT_FORM_THEME;

    const themeScope = {
        [FORM_THEME_ATTR]: formTheme,
    } as Record<string, string>;

    /**
     * The one and only scroll container. `h-dvh` (not `h-screen`) keeps it the
     * visible height on mobile browsers whose address bar collapses, and
     * `overscroll-contain` stops scroll chaining into the page behind it.
     */
    const themed = (children: ReactNode) => (
        <div
            {...themeScope}
            ref={scrollRef}
            className="bg-theme-form-surface h-dvh w-full scrollbar-none overflow-y-auto overscroll-contain"
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

    if (state === 'accepted')
        return themed(<Done message={confirmationMessage} />);

    const section = sections[current];
    const isLast = current >= sections.length - 1;
    // With conditional jumps, a mid-form section can resolve to submit —
    // preview the same resolver `goNext` uses so the button never lies.
    const navPreview = section
        ? resolveNavigation(section, sections, current, answers)
        : null;
    const willSubmit = isLast || navPreview?.kind === 'submit';
    const percent = total ? Math.round((answered / total) * 100) : 0;
    const sending = state === 'sending';

    return themed(
        <>
            {/* Sticky inside the scroll container, so it stays visible. */}
            <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-theme-form-surface sticky top-0 z-10"
            >
                <div className="bg-theme-form-on-surface/10 h-1.5 w-full overflow-hidden">
                    <div
                        className="bg-theme-form-container-active h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-16">
                <header className="mb-6 overflow-hidden rounded-xl bg-white">
                    <div className="bg-theme-form-container-active h-2 w-full" />
                    <div className="flex flex-col gap-2 p-4">
                        <h1 className="text-theme-form-on-surface text-2xl font-bold wrap-break-word">
                            {form.form.name || 'Untitled form'}
                        </h1>
                        <p className="text-theme-form-on-surface/60 text-sm">
                            Section {current + 1} of {sections.length} ·{' '}
                            {answered}/{total} answered
                        </p>
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

                <footer className="mt-6 flex items-center justify-between gap-3">
                    {history.length > 0 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={sending}
                            className="border-theme-form-on-surface/30 text-theme-form-on-surface hover:bg-theme-form-on-surface/5 rounded-md border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Back
                        </button>
                    ) : null}

                    {/* ml-auto keeps this on the right when Back is hidden. */}
                    <button
                        type="button"
                        onClick={willSubmit ? () => void handleSubmit() : goNext}
                        disabled={sending}
                        className="bg-theme-form-container-active text-theme-form-on-active ml-auto rounded-md px-5 py-2 text-sm font-medium transition-opacity disabled:opacity-60"
                    >
                        {getStatus(state, willSubmit)}
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
        </>
    );
}
