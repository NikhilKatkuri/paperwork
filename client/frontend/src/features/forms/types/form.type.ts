import Document from "./db.types";

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
    name: string;
    isPrivate: boolean;
    isPublished: boolean;
    allowedDomains?: string[];
    settings?: FormSettings;
    responseCount?: number;
}

type FormDocument = Document<FormCore>;

export type { FormSettings, FormDocument };
export default FormCore;
