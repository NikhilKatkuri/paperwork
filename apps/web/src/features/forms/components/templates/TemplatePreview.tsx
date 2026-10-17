'use client';

import type { Question, QuestionOption, Section } from '@paperwork/types';
import type { TemplateSummary } from '@/features/forms/api/user/templates';
import { cn } from '@/utils/cn';

type TemplateQuestion = Question & { sectionId: string };
type TemplateSection = Section & { id: string };

/** Small hint shown next to an answer that changes where the respondent goes. */
function actionHint(option: QuestionOption): string | null {
    if (option.action?.type === 'SUBMIT_FORM') return 'Ends the form';
    if (option.action?.type === 'GO_TO_SECTION') return 'Jumps ahead';
    return null;
}

function OptionRows({
    options,
    compact,
    shape,
}: {
    options: QuestionOption[];
    compact: boolean;
    shape: 'rounded-full' | 'rounded-sm';
}) {
    const visible = compact ? options.slice(0, 3) : options;

    return (
        <div className="space-y-1.5">
            {visible.map((option) => {
                const hint = compact ? null : actionHint(option);

                return (
                    <div key={option.index} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'border-theme-on-surface/30 h-3.5 w-3.5 shrink-0 border',
                                shape
                            )}
                        />
                        <span className="text-theme-on-surface/65 truncate text-xs">
                            {option.label}
                        </span>
                        {hint && (
                            <span className="bg-brand-light text-on-brand-light ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                                {hint}
                            </span>
                        )}
                    </div>
                );
            })}
            {visible.length < options.length && (
                <span className="text-theme-on-surface/45 text-xs">
                    +{options.length - visible.length} more
                </span>
            )}
        </div>
    );
}

function MatrixPreview({
    question,
    compact,
}: {
    question: TemplateQuestion;
    compact: boolean;
}) {
    const { rows = [], columns = [] } = question.matrixConfig ?? {};
    const visibleRows = compact ? rows.slice(0, 2) : rows;
    const visibleColumns = compact ? columns.slice(0, 4) : columns;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr>
                        <th />
                        {visibleColumns.map((column) => (
                            <th
                                key={column.id}
                                className="text-theme-on-surface/55 max-w-16 truncate px-1.5 pb-1.5 text-center text-[10px] font-normal"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visibleRows.map((row) => (
                        <tr key={row.id}>
                            <td className="text-theme-on-surface/65 max-w-32 truncate py-1 pr-2">
                                {row.label}
                            </td>
                            {visibleColumns.map((column) => (
                                <td
                                    key={column.id}
                                    className="px-1.5 py-1 text-center"
                                >
                                    <span className="border-theme-on-surface/30 inline-block h-3.5 w-3.5 rounded-full border" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {visibleRows.length < rows.length && (
                <span className="text-theme-on-surface/45 text-xs">
                    +{rows.length - visibleRows.length} more rows
                </span>
            )}
        </div>
    );
}

function QuestionControl({
    question,
    compact,
}: {
    question: TemplateQuestion;
    compact: boolean;
}) {
    const options = question.optionsConfig?.options ?? [];

    if (question.type === 'RADIO') {
        return (
            <OptionRows
                options={options}
                compact={compact}
                shape="rounded-full"
            />
        );
    }

    if (question.type === 'CHOICE') {
        return (
            <OptionRows
                options={options}
                compact={compact}
                shape="rounded-sm"
            />
        );
    }

    if (question.type === 'MATRIX') {
        return <MatrixPreview question={question} compact={compact} />;
    }

    if (question.type === 'DROP_DOWN') {
        return (
            <div className="border-theme-on-surface/15 text-theme-on-surface/45 flex items-center justify-between rounded-md border px-2.5 py-2 text-xs">
                <span>{options[0]?.label ?? 'Select an option'}</span>
                <span className="material-symbols-outlined text-sm">
                    expand_more
                </span>
            </div>
        );
    }

    if (question.type === 'RATING') {
        return (
            <div className="text-theme-on-surface/45 flex gap-1 text-sm">
                {Array.from({ length: question.ratingConfig?.scale ?? 5 }).map(
                    (_, index) => (
                        <span key={index} aria-hidden="true">
                            {question.ratingConfig?.icon === 'HEART'
                                ? '♥'
                                : '★'}
                        </span>
                    )
                )}
            </div>
        );
    }

    if (question.type === 'LINEAR_SCALE') {
        const lower = question.scaleConfig?.lowerBound ?? 1;
        const upper = question.scaleConfig?.upperBound ?? 5;

        return (
            <div className="flex flex-wrap gap-1">
                {Array.from({
                    length: Math.min(upper - lower + 1, compact ? 5 : 11),
                }).map((_, index) => (
                    <span
                        key={index}
                        className="border-theme-on-surface/15 text-theme-on-surface/55 flex h-6 min-w-6 items-center justify-center rounded border text-[10px]"
                    >
                        {lower + index}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'border-theme-on-surface/15 text-theme-on-surface/40 rounded-md border px-2.5 text-xs',
                question.type === 'PARAGRAPH' ? 'h-12 py-2' : 'h-8 py-2'
            )}
        >
            {question.placeholder ||
                (question.type === 'DATE'
                    ? 'Choose a date'
                    : question.type === 'TIME'
                      ? 'Choose a time'
                      : 'Short answer')}
        </div>
    );
}

function PreviewQuestion({
    question,
    compact,
}: {
    question: TemplateQuestion;
    compact: boolean;
}) {
    return (
        <div className={cn('space-y-2', compact ? 'py-1' : 'py-3')}>
            <div className="flex items-start gap-1">
                <p className="text-theme-on-surface text-xs leading-5 font-medium">
                    {question.question}
                </p>
                {question.isRequired && (
                    <span className="text-brand text-xs" aria-label="Required">
                        *
                    </span>
                )}
            </div>
            {!compact && question.helpText && (
                <p className="text-theme-on-surface/50 text-xs">
                    {question.helpText}
                </p>
            )}
            <QuestionControl question={question} compact={compact} />
        </div>
    );
}

export default function TemplatePreview({
    template,
    compact = false,
}: {
    template: TemplateSummary;
    compact?: boolean;
}) {
    const sections = [...(template.sections as TemplateSection[])].sort(
        (a, b) => a.index - b.index
    );
    const questions = template.questions as TemplateQuestion[];
    const visibleSections = compact ? sections.slice(0, 1) : sections;

    return (
        <div className={cn('space-y-4', compact && 'space-y-3')}>
            <div className="border-brand/30 bg-brand/5 rounded-md border-l-2 px-3 py-2">
                <p className="text-theme-on-surface truncate text-sm font-semibold">
                    {template.form.name || template.name}
                </p>
                {!compact && template.description && (
                    <p className="text-theme-on-surface/60 mt-1 text-xs leading-5">
                        {template.description}
                    </p>
                )}
            </div>

            {visibleSections.map((section, position) => {
                const sectionQuestions = questions
                    .filter((question) => question.sectionId === section.id)
                    .sort((a, b) => a.index - b.index);
                const visibleQuestions = compact
                    ? sectionQuestions.slice(0, 3)
                    : sectionQuestions;

                return (
                    <section
                        key={section.id}
                        className={cn(
                            'space-y-2',
                            !compact &&
                                position > 0 &&
                                'border-theme-on-surface/10 border-t pt-5'
                        )}
                    >
                        <div>
                            {!compact && sections.length > 1 && (
                                <p className="text-theme-on-surface/45 text-[11px]">
                                    Section {position + 1} of {sections.length}
                                </p>
                            )}
                            <h4 className="text-theme-on-surface text-xs font-semibold">
                                {section.title}
                            </h4>
                            {!compact && section.description && (
                                <p className="text-theme-on-surface/50 mt-0.5 text-xs">
                                    {section.description}
                                </p>
                            )}
                        </div>
                        <div className="border-theme-on-surface/10 divide-theme-on-surface/10 divide-y border-t">
                            {visibleQuestions.map((question) => (
                                <PreviewQuestion
                                    key={`${section.id}-${question.slug}`}
                                    question={question}
                                    compact={compact}
                                />
                            ))}
                        </div>
                        {visibleQuestions.length < sectionQuestions.length && (
                            <p className="text-theme-on-surface/45 text-xs">
                                +
                                {sectionQuestions.length -
                                    visibleQuestions.length}{' '}
                                more questions
                            </p>
                        )}
                    </section>
                );
            })}
            {visibleSections.length < sections.length && (
                <p className="text-theme-on-surface/45 text-xs">
                    +{sections.length - visibleSections.length} more sections
                </p>
            )}
        </div>
    );
}
