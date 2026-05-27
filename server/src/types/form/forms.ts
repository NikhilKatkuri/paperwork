enum QUESTION_TYPE {
    TEXT = 'TEXT',
    PARAGRAPH = 'PARAGRAPH',
    CHOICE = 'CHOICE',
    RADIO = 'RADIO',
    DROP_DOWN = 'DROP_DOWN',
    LINEAR_SCALE = 'LINEAR_SCALE',
    RATING = 'RATING',
    DATE = 'DATE',
    TIME = 'TIME',
}

type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

interface DependsOn {
    questionId: string;
    value: string;
}

interface Option {
    index: number;
    value: string;
}

/**
 * Questions with selectable options (provided by user input)
 * Questions with auto-generated options:
 *   - LINEAR_SCALE: 1–10
 *   - RATING: 1–5
 */

interface QuestionBase {
    type: QuestionType;
    question: string;
    dependsOn?: DependsOn;
    options?: Option[];
}

interface TextBased {
    type:
        | QUESTION_TYPE.TEXT
        | QUESTION_TYPE.PARAGRAPH
        | QUESTION_TYPE.DATE
        | QUESTION_TYPE.TIME;
    question: string;
    dependsOn?: DependsOn;
    options?: never;
}

interface RadioBased {
    type: QUESTION_TYPE.CHOICE | QUESTION_TYPE.RADIO | QUESTION_TYPE.DROP_DOWN;
    question: string;
    dependsOn?: DependsOn;
    options?: Option[];
}

interface ScaleBased {
    type: QUESTION_TYPE.LINEAR_SCALE | QUESTION_TYPE.RATING;
    question: string;
    dependsOn?: DependsOn;
    options?: never;
}

type QuestionEntity = TextBased | RadioBased | ScaleBased;

type SectionAction =
    | { type: 'NEXT_SECTION' }
    | { type: 'GO_TO_SECTION'; sectionIndex: number }
    | { type: 'SUBMIT_FORM' };

interface SectionDependsOn {
    questionIndex: number;
    value: string;
    action: SectionAction;
}

interface Section {
    index: number;
    title: string;
    description?: string;
    questions: QuestionEntity[];
    onAnswer?: SectionDependsOn[];
    defaultAction?: SectionAction;
}

interface FormType {
    title: string;
    description: string;
    isPrivate: boolean;
    isPublished: boolean;
    allowedDomains?: string[];
    sectionss: Section[];
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
    FormType,
    Section,
    SectionAction,
    SectionDependsOn,
    QuestionBase,
};
