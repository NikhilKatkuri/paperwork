import { FormTheme } from './constants/enums';

export interface FormSettings {
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

export interface Form {
    name: string;
    userId: string;
    isPrivate: boolean;
    isPublished: boolean;
    accessCode?: string;
    allowedDomains?: string[];
    settings?: FormSettings;
    responseCount?: number;
    theme?: FormTheme;
}
