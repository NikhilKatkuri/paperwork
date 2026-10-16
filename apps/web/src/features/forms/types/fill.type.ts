import {
    QuestionOptionConfig,
    QuestionType,
    SectionDoc,
} from '@paperwork/types';
import FormCore from './form.type';

type RuleType =
    | 'EMAIL'
    | 'URL'
    | 'NUMBER_GREATER_THAN'
    | 'NUMBER_LESS_THAN'
    | 'MAX_CHAR_COUNT'
    | 'MIN_CHAR_COUNT'
    | 'CHECKBOX_MAX_SELECT'
    | 'CHECKBOX_MIN_SELECT'
    | 'NUMBER_BETWEEN'
    | 'REGEX_MATCH';

interface BaseRule {
    customErrorMessage?: string;
}

type ValidationRule =
    | (BaseRule & { ruleType: 'EMAIL' | 'URL' })
    | (BaseRule & {
          ruleType:
              | 'NUMBER_GREATER_THAN'
              | 'NUMBER_LESS_THAN'
              | 'MAX_CHAR_COUNT'
              | 'MIN_CHAR_COUNT'
              | 'CHECKBOX_MAX_SELECT'
              | 'CHECKBOX_MIN_SELECT';
          value: number;
      })
    | (BaseRule & { ruleType: 'NUMBER_BETWEEN'; min: number; max: number })
    | (BaseRule & { ruleType: 'REGEX_MATCH'; pattern: string });

interface RatingConfig {
    icon: string;
    scale: number;
    lowLabel?: string;
    highLabel?: string;
}

/** A question as returned by `GET /forms/:id/fill`. */
interface FillQuestion {
    _id: string;
    index: number;
    sectionId: string;
    type: QuestionType;
    question: string;
    helpText?: string;
    optionsConfig?: QuestionOptionConfig;
    ratingConfig?: RatingConfig;
    validationRule?: ValidationRule;
    placeholder?: string;
    isRequired?: boolean;
}

/** A section as returned by `GET /forms/:id/fill`, with its questions nested. */
interface FillSection extends Omit<SectionDoc, '_id'> {
    _id: string;
    questions: FillQuestion[];
}

interface FillForm {
    form: FormCore & { _id: string; responseCount?: number };
    sections: FillSection[];
}

/** Answers are keyed by question id; each entry is one or more string values. */
type AnswerMap = Record<string, string[]>;

export type {
    BaseRule,
    FillForm,
    FillQuestion,
    FillSection,
    QuestionType,
    RatingConfig,
    RuleType,
    ValidationRule,
};

export default AnswerMap;
