import {
    CreateFormDoc,
    FormSettings,
    Question,
    QuestionTypeEnum,
    Section,
} from '@paperwork/types';

const defaultFormSettings: FormSettings = {
    maxResponses: undefined,
    maxResponsesPerUser: undefined,
    closeDate: undefined,
    startDate: undefined,
    timeLimitPerResponse: undefined,

    collectEmail: false,

    shuffleQuestions: false,
    allowEditResponse: false,
    saveAndContinueLater: false,
    progressBar: false,

    customConfirmationMessage: undefined,
    redirectUrl: undefined,
};

const createDefaultForm: () => CreateFormDoc = () => {
    const obj: CreateFormDoc = {
        name: `Untitled form`,
        isPrivate: false,
        isPublished: false,
        allowedDomains: undefined,
        settings: defaultFormSettings,
        responseCount: 0,
        section: defaultSection,
        questions: [],
    };

    obj.questions.push(defaultQuestion);
    return obj;
};

const defaultSection: Section = {
    index: 0,
    title: 'Untitled section',
    description: 'This is a default section description.',
    defaultAction: { type: 'NEXT_SECTION' },
};

const defaultQuestion: Question = {
    index: 0,
    type: QuestionTypeEnum.TEXT,
    question: 'Untitled Question',
    slug: 'untitled-question-slug',
};

export {
    defaultFormSettings,
    createDefaultForm,
    defaultSection,
    defaultQuestion,
};
