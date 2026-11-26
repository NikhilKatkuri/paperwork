import { FormTheme } from './constants/enums';

/** How long a form stays in the bin before the server purges it. */
export const FORM_BIN_RETENTION_DAYS = 7;

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
    /** Set when the form is in the bin. Cleared on restore. Server-owned. */
    deletedAt?: string;
}
