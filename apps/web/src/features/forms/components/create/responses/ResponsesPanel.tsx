'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const FOCUS_RING =
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface focus-visible:outline-none';

export default function ResponsesPanel() {
    const { formId: activeFormID, questionsMap, form } = useForm();

    const [mode, setMode] = useState<ViewMode>('summary');
    const [filters, setFilters] = useState<ResponseFilters>({ sort: 'newest' });
    const [filterResetKey, setFilterResetKey] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

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

    // Press "/" anywhere to jump to search, mirroring TemplateGallery.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key !== '/' ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }
            const target = event.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.isContentEditable)
            ) {
                return;
            }
            event.preventDefault();
            searchRef.current?.focus();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

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
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-theme-on-surface/55 text-sm">
                    Open a form to see its responses.
                </p>
            </div>
        );
    }

    return (
        <main className="bg-theme-surface text-theme-on-surface mx-auto flex h-full w-full max-w-6xl scrollbar-none flex-col overflow-y-auto px-3 sm:px-6">
            {/* Sticky Top Header (inspired by TemplateHeader) */}
            <header className="bg-theme-surface/95 sticky top-0 z-30 flex flex-col gap-4 pt-5 pb-4 backdrop-blur-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-theme-on-surface truncate text-lg font-semibold tracking-tight sm:text-xl">
                                {form?.name || 'Form responses'}
                            </h1>
                            <span className="bg-brand-light text-on-brand-light inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums">
                                {summaryLoading && !summary ? '—' : total}{' '}
                                {total === 1 ? 'response' : 'responses'}
                            </span>
                        </div>
                        <p className="text-theme-on-surface/55 mt-0.5 text-xs tabular-nums">
                            {questions.length} questions tracked · {coverage}%
                            coverage
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Segmented View Switcher */}
                        <div
                            role="tablist"
                            aria-label="Response views"
                            className="border-theme-on-surface/10 bg-theme-surface inline-flex rounded-md border p-0.5"
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
                                            'flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                                            FOCUS_RING,
                                            active
                                                ? 'bg-brand-light text-on-brand-light'
                                                : 'text-theme-on-surface/65 hover:bg-theme-surface-hover hover:text-theme-on-surface'
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={exporting || total === 0}
                            className={cn(
                                'border-theme-on-surface/15 text-theme-on-surface hover:bg-theme-surface-hover flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                                FOCUS_RING
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {exporting ? 'progress_activity' : 'download'}
                            </span>
                            <span className="hidden sm:inline">
                                {exporting ? 'Exporting…' : 'Export CSV'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Search & Filter Row */}
                <ResponseFiltersBar
                    key={filterResetKey}
                    filters={filters}
                    questions={questions}
                    onChange={applyFilters}
                    searchRef={searchRef}
                />
            </header>

            {/* Main Content Body */}
            <div className="flex flex-1 flex-col gap-6 pt-2 pb-20">
                {exportError ? (
                    <div
                        role="alert"
                        className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                    >
                        <span className="material-symbols-outlined text-base">
                            error
                        </span>
                        {exportError}
                    </div>
                ) : null}

                {summaryError && mode !== 'individual' ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                        <span className="bg-brand-light text-on-brand-light flex h-12 w-12 items-center justify-center rounded-lg">
                            <span className="material-symbols-outlined text-2xl">
                                cloud_off
                            </span>
                        </span>
                        <p
                            role="alert"
                            className="text-theme-on-surface/65 max-w-sm text-sm"
                        >
                            {summaryError}
                        </p>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className={cn(
                                'bg-brand text-on-brand rounded-md px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90',
                                FOCUS_RING
                            )}
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
        </main>
    );
}
