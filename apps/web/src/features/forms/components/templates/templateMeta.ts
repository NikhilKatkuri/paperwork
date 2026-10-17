import type { Question, Section } from '@paperwork/types';
import type { TemplateSummary } from '@/features/forms/api/user/templates';

type TemplateQuestion = Question & { sectionId: string };
type TemplateSection = Section & { id: string };

export interface TemplateStats {
    sections: number;
    questions: number;
    required: number;
    /** True when any answer or section changes where the respondent goes next. */
    hasBranching: boolean;
    /** Rough completion time in whole minutes (never less than 1). */
    minutes: number;
}

/** Seconds a respondent typically needs per question type. */
const SECONDS_PER_TYPE: Record<string, number> = {
    TEXT: 15,
    PARAGRAPH: 45,
    DATE: 8,
    TIME: 8,
    CHOICE: 12,
    RADIO: 8,
    DROP_DOWN: 8,
    LINEAR_SCALE: 6,
    RATING: 5,
    MATRIX: 30,
};

export function getTemplateStats(template: TemplateSummary): TemplateStats {
    const sections = template.sections as TemplateSection[];
    const questions = template.questions as TemplateQuestion[];

    const hasBranching =
        sections.some((section) => (section.rules?.length ?? 0) > 0) ||
        questions.some((question) =>
            question.optionsConfig?.options.some(
                (option) =>
                    option.action && option.action.type !== 'NEXT_SECTION'
            )
        );

    const seconds = questions.reduce(
        (total, question) => total + (SECONDS_PER_TYPE[question.type] ?? 12),
        0
    );

    return {
        sections: sections.length,
        questions: questions.length,
        required: questions.filter((question) => question.isRequired).length,
        hasBranching,
        minutes: Math.max(1, Math.round(seconds / 60)),
    };
}

export function isFeatured(template: TemplateSummary): boolean {
    return Boolean(
        (template as TemplateSummary & { isFeatured?: boolean }).isFeatured
    );
}

/**
 * Searches name, description, category AND question text, so "dietary" or
 * "t-shirt size" finds the templates that actually ask for it. Every word
 * must match somewhere.
 */
export function matchesTemplate(
    template: TemplateSummary,
    query: string
): boolean {
    const haystack = [
        template.name,
        template.description,
        template.category,
        ...(template.questions as TemplateQuestion[]).map(
            (question) => question.question
        ),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => haystack.includes(word));
}
