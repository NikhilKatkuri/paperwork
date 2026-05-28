enum QUESTION_TYPE {
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

type RatingIconType = 'STAR' | 'HEART' | 'THUMB_UP';

type RatingScale = 5 | 10;

interface RatingConfig {
    icon: RatingIconType;
    scale: RatingScale;
    lowLabel?: string;
    highLabel?: string;
}

interface DependsOn {
    questionId: string;
    value: string;
}

interface Option {
    index: number;
    label: string;
    value: string;
}

interface FieldValidationRule {
    ruleType:
        | 'EMAIL'
        | 'URL'
        | 'NUMBER_GREATER_THAN'
        | 'NUMBER_LESS_THAN'
        | 'REGEX_MATCH'
        | 'MAX_CHAR_COUNT';
    value?: string | number;
    customErrorMessage?: string;
}

interface QuestionCore {
    index: number;
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

interface questionBase {
    index: string;

    question: string;

    helpText?: string;

    dependsOn?: DependsOn;
    validationRule?: FieldValidationRule;

    placeholder?: string;
    isRequired?: boolean;
}

interface TextBased extends questionBase {
    type:
        | QUESTION_TYPE.TEXT
        | QUESTION_TYPE.PARAGRAPH
        | QUESTION_TYPE.DATE
        | QUESTION_TYPE.TIME;
    options?: never;
    ratingConfig?: never;
}

interface RadioBased extends questionBase {
    type: QUESTION_TYPE.CHOICE | QUESTION_TYPE.RADIO | QUESTION_TYPE.DROP_DOWN;
    options: Option[];
    ratingConfig?: never;
}

interface ScaleBased extends questionBase {
    type: QUESTION_TYPE.LINEAR_SCALE | QUESTION_TYPE.RATING;
    options?: never;
    ratingConfig: RatingConfig;
}

type QuestionEntity = TextBased | RadioBased | ScaleBased;

type SectionAction =
    | { actionType: 'NEXT_SECTION' }
    | { actionType: 'GO_TO_SECTION'; sectionId: string }
    | { actionType: 'SUBMIT_FORM' };

interface SectionDependsOn {
    questionId: string;
    value: string;
    action: SectionAction;
}

interface SectionCore {
    index: number;
    title: string;
    description?: string;
    onAnswer?: SectionDependsOn[];
    defaultAction?: SectionAction;
}

interface FormSettings {
    maxResponses?: number;
    maxResponsesPerUser?: number;
    closeDate?: Date;
    startDate?: Date;
    timeLimitPerResponse?: number;

    collectEmail?: boolean;

    shuffleQuestions?: boolean;
    allowEditResponse?: boolean;
    saveAndContinueLater?: boolean;
    progressBar?: boolean;

    customConfirmationMessage?: string;
    redirectUrl?: string;
}

interface FormCore {
    title: string;
    description: string;
    isPrivate: boolean;
    isPublished: boolean;
    allowedDomains?: string[];
    settings?: FormSettings;
    responseCount?: number;
}

interface AnswerEntry {
    questionId: string;
    values: string[];
}

interface ResponseCore {
    formId: string;
    userId: string;
    email: string;
    answers: AnswerEntry[];
}

export {
    QUESTION_TYPE,
    QuestionType,
    DependsOn,
    Option,
    TextBased,
    RadioBased,
    ScaleBased,
    QuestionEntity,
    FormCore,
    SectionCore,
    SectionAction,
    SectionDependsOn,
    QuestionCore,
    AnswerEntry,
    ResponseCore,
    FormSettings,
};
