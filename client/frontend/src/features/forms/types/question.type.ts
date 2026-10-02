type BaseRule = { customErrorMessage?: string };

type ValidationRule =
    | (BaseRule & { ruleType: 'EMAIL' | 'URL' })
    | (BaseRule & {
          ruleType:
              | 'NUMBER_GREATER_THAN'
              | 'NUMBER_LESS_THAN'
              | 'MAX_CHAR_COUNT'
              | 'MIN_CHAR_COUNT'
              | 'CHECKBOX_MIN_SELECT'
              | 'CHECKBOX_MAX_SELECT';
          value: number;
      })
    | (BaseRule & { ruleType: 'NUMBER_BETWEEN'; min: number; max: number })
    | (BaseRule & { ruleType: 'REGEX_MATCH'; pattern: string });

interface FieldValidationRule extends BaseRule {
    ruleType: ValidationRule['ruleType'];
    value?: number;
    min?: number;
    max?: number;
    pattern?: string;
}

type RatingIconType = 'STAR' | 'HEART' | 'THUMB_UP';

type RatingScale = number;

interface RatingConfig {
    icon: RatingIconType;
    scale: RatingScale;
    lowLabel?: string;
    highLabel?: string;
}

export enum QUESTION_TYPE {
    TEXT = 'TEXT',
    PARAGRAPH = 'PARAGRAPH',
    DATE = 'DATE',
    TIME = 'TIME',
    CHOICE = 'CHOICE',
    RADIO = 'RADIO',
    DROP_DOWN = 'DROP_DOWN',
    LINEAR_SCALE = 'LINEAR_SCALE',
    RATING = 'RATING',
}

type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

interface Option {
    index: number;
    label: string;
}

interface DependsOn {
    questionId: string;
    value: string;
}

interface QuestionCore {
    /** Mongo-compatible id - required by the bulk sync endpoint. */
    _id: string;
    index: number;
    /** Ordinal position within the sections array; resolved to a sectionId on sync. */
    sectionIdx: number;

    type: QuestionType;
    question: string;
    helpText?: string;

    options?: Option[];
    dependsOn?: DependsOn;
    ratingConfig?: RatingConfig;
    validationRule?: FieldValidationRule;

    placeholder?: string;
    isRequired?: boolean;
}

export type {
    QuestionType,
    Option,
    DependsOn,
    RatingConfig,
    FieldValidationRule,
};
export default QuestionCore;
