import FormCore, { FormSettings } from "../types/form.type";
import QuestionCore, { QUESTION_TYPE } from "../types/question.type";
import SectionCore from "../types/section.type";

 
const DEFAULT_FORM_SETTINGS: FormSettings = {
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

const DEFAULT_FORM_CORE: FormCore = {
    name: `Untitled form`,
    isPrivate: false,
    isPublished: false,
    allowedDomains: undefined,
    settings: DEFAULT_FORM_SETTINGS,
    responseCount: 0,
};

const DEFAULT_SECTION_CORE: SectionCore = {
    index: 0,
    title: 'Untitled section',
    description: 'This is a default section description.',
    onAnswer: undefined,
    defaultAction: {actionType: 'NEXT_SECTION'},
};

const DEFAULT_QUESTION_CORE:QuestionCore = {
    index: 0,
    sectionIdx: 0,
    type: QUESTION_TYPE.TEXT,
    question: 'Untitled Question',
    helpText: undefined,
    options: undefined,
    dependsOn: undefined,
    ratingConfig: undefined,
    validationRule: undefined,
    placeholder: undefined,
    isRequired: false,
}
export { DEFAULT_FORM_SETTINGS, DEFAULT_FORM_CORE, DEFAULT_SECTION_CORE, DEFAULT_QUESTION_CORE };