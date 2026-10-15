import { QuestionTypeEnum } from './constants/enums';

export type RatingIconType = 'STAR' | 'HEART' | 'THUMB_UP';
export type RatingScale = 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface RatingConfig {
    icon: RatingIconType;
    scale: RatingScale;
    lowLabel?: string;
    highLabel?: string;
}

export interface QuestionDependency {
    questionId: string;
    value: string;
}

export interface QuestionOption {
    index: number;
    label: string;
}

export interface MatrixRow {
    id: string;
    label: string;
}

export interface MatrixColumn {
    id: string;
    label: string;
}

export interface MatrixConfig {
    rows: MatrixRow[];
    columns: MatrixColumn[];
    allowMultiplePerColumn?: boolean;
}

export type ValidationRule =
    | { ruleType: 'EMAIL' | 'URL'; customErrorMessage?: string }
    | {
          ruleType:
              | 'NUMBER_GREATER_THAN'
              | 'NUMBER_LESS_THAN'
              | 'MAX_CHAR_COUNT'
              | 'MIN_CHAR_COUNT'
              | 'CHECKBOX_MIN_SELECT'
              | 'CHECKBOX_MAX_SELECT';
          value: number;
          customErrorMessage?: string;
      }
    | {
          ruleType: 'NUMBER_BETWEEN';
          min: number;
          max: number;
          customErrorMessage?: string;
      }
    | { ruleType: 'REGEX_MATCH'; pattern: string; customErrorMessage?: string };

interface QuestionOptionConfig {
    options: QuestionOption[];
    expectedAnswer?: number | number[];
}
export interface Question {
    index: number;
    question: string;
    helpText?: string;
    slug: string;
    type: QuestionTypeEnum;
    dependsOn?: QuestionDependency;
    validationRule?: ValidationRule;
    placeholder?: string;
    isRequired?: boolean;
    optionsConfig?: QuestionOptionConfig;
    ratingConfig?: RatingConfig;
    matrixConfig?: MatrixConfig;
    correctAnswer?: string | number | number[] | Record<string, string>;
}

export interface TextQuestion extends Question {
    type:
        | QuestionTypeEnum.TEXT
        | QuestionTypeEnum.PARAGRAPH
        | QuestionTypeEnum.DATE
        | QuestionTypeEnum.TIME;
    options?: never;
    ratingConfig?: never;
    matrixConfig?: never;
}

export interface ChoiceQuestion extends Question {
    type:
        | QuestionTypeEnum.CHOICE
        | QuestionTypeEnum.RADIO
        | QuestionTypeEnum.DROP_DOWN;
    options: QuestionOption[];
    correctAnswer?: number | number[];
    ratingConfig?: never;
    matrixConfig?: never;
}

export interface ScaleQuestion extends Question {
    type: QuestionTypeEnum.LINEAR_SCALE | QuestionTypeEnum.RATING;
    options?: never;
    ratingConfig: RatingConfig;
    matrixConfig?: never;
}

export interface MatrixQuestion extends Question {
    type: QuestionTypeEnum.MATRIX;
    options?: never;
    ratingConfig?: never;
    matrixConfig: MatrixConfig;
}

export type QuestionFormats =
    TextQuestion | ChoiceQuestion | ScaleQuestion | MatrixQuestion;
