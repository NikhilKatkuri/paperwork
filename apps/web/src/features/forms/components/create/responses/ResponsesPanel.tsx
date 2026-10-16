'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import ResponseFiltersBar from './ResponseFiltersBar';
import SummaryView from './SummaryView';
import QuestionView from './QuestionView';
import IndividualView from './IndividualView';

import { useForm } from '@/features/forms/providers/form';
import {
    downloadResponsesCsv,
    useResponseSummary,
    type ResponseFilters,
} from '@/features/forms/api/user/formResponses';

type ViewMode = 'summary' | 'question' | 'individual';

const TABS = [
    { id: 'summary', label: 'Summary', icon: 'bar_chart' },
    { id: 'question', label: 'Question', icon: 'quiz' },
    { id: 'individual', label: 'Individual', icon: 'person' },
] as const satisfies ReadonlyArray<{
    id: ViewMode;
    label: string;
    icon: string;
}>;

/**
 * Responses: a count header, Summary / Question / Individual tabs, search +
 * sort filters, and CSV export.
 */
export default function ResponsesPanel() {
    const { formId: activeFormID, questionsMap, form } = useForm();

    const [mode, setMode] = useState<ViewMode>('summary');
    const [filters, setFilters] = useState<ResponseFilters>({ sort: 'newest' });
    const [filterResetKey, setFilterResetKey] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const questions = useMemo(() => [...questionsMap.values()], [questionsMap]);
    const formId = activeFormID ?? undefined;

    const {
        summary,
        loading: summaryLoading,
        error: summaryError,
    } = useResponseSummary(formId, filters);

    const total = summary?.totalResponses ?? 0;
    const answeredQuestions =
        summary?.questions.filter((question) => question.answered > 0).length ??
        0;
    const coverage = questions.length
        ? Math.round((answeredQuestions / questions.length) * 100)
        : 0;

    const applyFilters = useCallback((next: ResponseFilters) => {
        setFilters(next);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ sort: 'newest' });
        setFilterResetKey((k) => k + 1);
    }, []);

    const resetKey = `${formId ?? ''}:${filters.q ?? ''}:${filters.questionId ?? ''}:${filters.sort ?? ''}:${filterResetKey}`;

    const handleExport = useCallback(async () => {
        if (!formId || exporting) return;
        setExporting(true);
        setExportError(null);
        try {
            await downloadResponsesCsv(formId, filters);
        } catch (e) {
            setExportError(
                e instanceof Error ? e.message : 'Export failed. Try again.'
            );
        } finally {
            setExporting(false);
        }
    }, [formId, filters, exporting]);

    if (!activeFormID) {
        return (
            <p className="p-6 text-sm text-neutral-500">
                Open a form to see its responses.
            </p>
        );
    }

    return (
        <div className="bg-theme-form-surface text-theme-form-on-surface mx-auto flex h-full w-full max-w-4xl scrollbar-none flex-col overflow-y-auto px-4 py-5 sm:px-6 md:py-7">
            <div className="border-theme-form-container-border overflow-hidden rounded-2xl border bg-white shadow-sm">
                <header className="bg-theme-form-container-active relative overflow-hidden px-5 py-6 text-white sm:px-7">
                    <div className="pointer-events-none absolute -top-20 -right-12 h-48 w-48 rounded-full border-24 border-white/15" />
                    <div className="pointer-events-none absolute right-24 -bottom-20 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-white/75 uppercase">
                                <span className="grid h-6 w-6 place-items-center rounded-md bg-white/10">
                                    <span className="material-symbols-outlined text-sm">
                                        analytics
                                    </span>
                                </span>
                                Response center
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {form?.name || 'Form responses'}
                            </h2>
                            <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                                See what your audience is saying, spot patterns,
                                and review every submission in one place.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={exporting || total === 0}
                            className="text-theme-form-container-active flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-bold shadow-sm transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {exporting ? 'progress_activity' : 'download'}
                            </span>
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </header>

                <div className="border-theme-form-container-border grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        <span className="bg-theme-form-container-active/10 text-theme-form-container-active grid h-9 w-9 place-items-center rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                                forum
                            </span>
                        </span>
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-400 uppercase">
                                Total responses
                            </p>
                            <p className="text-theme-form-on-container mt-0.5 text-xl font-semibold tabular-nums">
                                {summaryLoading && !summary ? '-' : total}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        <span className="bg-theme-form-container-active/10 text-theme-form-container-active grid h-9 w-9 place-items-center rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                                check_circle
                            </span>
                        </span>
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-400 uppercase">
                                Question coverage
                            </p>
                            <p className="text-theme-form-on-container mt-0.5 text-xl font-semibold tabular-nums">
                                {coverage}%
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        <span className="bg-theme-form-container-active/10 text-theme-form-container-active grid h-9 w-9 place-items-center rounded-lg">
                            <span className="material-symbols-outlined text-xl">
                                quiz
                            </span>
                        </span>
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-400 uppercase">
                                Questions tracked
                            </p>
                            <p className="text-theme-form-on-container mt-0.5 text-xl font-semibold tabular-nums">
                                {questions.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 p-4 sm:p-6">
                    <div
                        role="tablist"
                        aria-label="Response views"
                        className="bg-theme-form-container-active/10 grid grid-cols-3 gap-1 rounded-xl p-1"
                    >
                        {TABS.map((tab) => {
                            const active = mode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    type="button"
                                    aria-selected={active}
                                    onClick={() => setMode(tab.id)}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-all',
                                        active
                                            ? 'bg-theme-form-container text-theme-form-on-container shadow-sm'
                                            : 'text-theme-form-on-surface/60 hover:text-theme-form-on-surface'
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {tab.icon}
                                    </span>
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {exportError ? (
                        <div
                            role="alert"
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                        >
                            <span className="material-symbols-outlined text-lg">
                                error
                            </span>
                            {exportError}
                        </div>
                    ) : null}

                    <ResponseFiltersBar
                        key={filterResetKey}
                        filters={filters}
                        questions={questions}
                        onChange={applyFilters}
                    />

                    {summaryError && mode !== 'individual' ? (
                        <div className="flex flex-col items-start gap-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <p role="alert" className="text-sm text-red-600">
                                {summaryError}
                            </p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-medium text-neutral-900 hover:underline"
                            >
                                Clear filters and retry
                            </button>
                        </div>
                    ) : mode === 'summary' ? (
                        <SummaryView
                            summary={summary}
                            questions={questions}
                            loading={summaryLoading}
                            totalResponses={total}
                        />
                    ) : mode === 'question' ? (
                        <QuestionView
                            summary={summary}
                            questions={questions}
                            loading={summaryLoading}
                            totalResponses={total}
                        />
                    ) : formId ? (
                        <IndividualView
                            formId={formId}
                            filters={filters}
                            questions={questions}
                            resetKey={resetKey}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
