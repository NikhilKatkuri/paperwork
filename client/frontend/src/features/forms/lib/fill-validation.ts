import type { FillQuestion, ValidationRule } from '../types/fill.type';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/;

/** Trimmed values with empties removed - an untouched optional input is not an error. */
function present(values: string[]): string[] {
    return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

function defaultMessage(rule: ValidationRule): string {
    switch (rule.ruleType) {
        case 'EMAIL':
            return 'Enter a valid email address';
        case 'URL':
            return 'Enter a valid URL (starting with http:// or https://)';
        case 'NUMBER_GREATER_THAN':
            return `Enter a number greater than ${rule.value}`;
        case 'NUMBER_LESS_THAN':
            return `Enter a number less than ${rule.value}`;
        case 'MAX_CHAR_COUNT':
            return `Use at most ${rule.value} characters`;
        case 'MIN_CHAR_COUNT':
            return `Use at least ${rule.value} characters`;
        case 'CHECKBOX_MAX_SELECT':
            return `Select at most ${rule.value} option(s)`;
        case 'CHECKBOX_MIN_SELECT':
            return `Select at least ${rule.value} option(s)`;
        case 'NUMBER_BETWEEN':
            return `Enter a number between ${rule.min} and ${rule.max}`;
        case 'REGEX_MATCH':
            return 'Answer does not match the expected format';
        default:
            return 'Invalid answer';
    }
}

/**
 * Validate one question's answers.
 *
 * Returns null when valid, otherwise the message to show. A question with no
 * rule is accepted as-is - the server stays the authority on anything beyond
 * what the editor can express.
 */
export function validateQuestion(
    question: FillQuestion,
    values: string[] = []
): string | null {
    const answers = present(values);

    if (question.isRequired && answers.length === 0) {
        return 'This question is required';
    }

    if (answers.length === 0) return null;

    const rule = question.validationRule;

    if (!rule) return null;

    const fail = () => rule.customErrorMessage || defaultMessage(rule);

    switch (rule.ruleType) {
        case 'EMAIL':
            return EMAIL.test(answers[0]) ? null : fail();

        case 'URL':
            return URL.test(answers[0]) ? null : fail();

        case 'MAX_CHAR_COUNT':
            return answers[0].length <= rule.value ? null : fail();

        case 'MIN_CHAR_COUNT':
            return answers[0].length >= rule.value ? null : fail();

        case 'CHECKBOX_MIN_SELECT':
            return answers.length >= rule.value ? null : fail();

        case 'CHECKBOX_MAX_SELECT':
            return answers.length <= rule.value ? null : fail();

        case 'NUMBER_GREATER_THAN': {
            const numeric = Number(answers[0]);

            if (Number.isNaN(numeric)) return 'Enter a number';
            return numeric > rule.value ? null : fail();
        }

        case 'NUMBER_LESS_THAN': {
            const numeric = Number(answers[0]);

            if (Number.isNaN(numeric)) return 'Enter a number';
            return numeric < rule.value ? null : fail();
        }

        case 'NUMBER_BETWEEN': {
            const numeric = Number(answers[0]);

            if (Number.isNaN(numeric)) return 'Enter a number';
            return numeric >= rule.min && numeric <= rule.max ? null : fail();
        }

        case 'REGEX_MATCH': {
            try {
                // Reject patterns that are not valid regex rather than throwing.
                return new RegExp(rule.pattern).test(answers[0])
                    ? null
                    : fail();
            } catch {
                return null;
            }
        }

        default:
            return null;
    }
}

/** Validate a whole section, returning the first error per question id. */
export function validateSection(
    questions: FillQuestion[],
    answers: Record<string, string[]>
): Record<string, string> {
    const errors: Record<string, string> = {};

    questions.forEach((question) => {
        const message = validateQuestion(question, answers[question._id]);

        if (message) errors[question._id] = message;
    });

    return errors;
}

/**
 * Build the request body.
 *
 * The endpoint rejects an empty `values` array, and its schema also rejects a
 * whole question when the array is present but blank - so unanswered questions
 * are omitted entirely rather than sent with empty strings.
 */
export function toSubmissionPayload(
    sections: { questions: FillQuestion[] }[],
    answers: Record<string, string[]>
): { questionId: string; values: string[] }[] {
    const payload: { questionId: string; values: string[] }[] = [];

    sections.forEach((section) =>
        section.questions.forEach((question) => {
            const values = present(answers[question._id] ?? []);

            if (values.length)
                payload.push({ questionId: question._id, values });
        })
    );

    return payload;
}
