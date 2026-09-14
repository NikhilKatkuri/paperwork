import { QUESTION_TYPE } from '../components/common/types';
import FormCore from './form.type';
import QuestionCore, {
    DependsOn,
    FieldValidationRule,
    Option,
    RatingConfig,
} from './question.type';
import SectionCore, { defualtSectionCore } from './section.type';

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

interface Time {
    updatedAt: Date;
    createdAt: Date;
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
    metadata: {
        userAgent: string;
        ipAddress: string;
    };
}

export type QuestionsMap = Map<number, QuestionCore>;

interface FormCreateContextValue {
    form: FormCore;
    handleFormChange: <k extends keyof FormCore>(
        key: k,
        value: FormCore[k]
    ) => void;

    sections: defualtSectionCore;
    setSections: React.Dispatch<React.SetStateAction<defualtSectionCore>>;
    handleSectionsChange: <K extends keyof SectionCore>(
        idx: number,
        key: K,
        value: SectionCore[K]
    ) => void;
    handleAddSection: () => void;

    handleAddQuestion: (idx: number) => void;
    duplicateQuestion: (idx: number) => void;
    deleteQuestion: (idx: number) => void;
    questions: QuestionsMap;
    setQuestions: React.Dispatch<React.SetStateAction<QuestionsMap>>;
    updateQuestion: (
        idx: number,
        updatedQuestion: Partial<QuestionCore>
    ) => void;
    handleQuestionChange: <K extends keyof QuestionCore>(
        idx: number,
        key: K,
        value: QuestionCore[K]
    ) => void;
    reorderQuestions: (sectionIdx: number, activeId: number, overId: number) => void;

    reorderSections: (activeId: number, overId: number) => void;
    deleteSection: (sectionIdx: number) => void;
}

export type Tabs = 'questions' | 'settings' | 'responses';

export type {
    TextBased,
    RadioBased,
    ScaleBased,
    QuestionEntity,
    AnswerEntry,
    ResponseCore,
    Time,
    FormCreateContextValue,
};
