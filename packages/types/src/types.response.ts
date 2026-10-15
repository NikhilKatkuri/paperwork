export type AnswerValue = string | number | string[] | boolean;

export interface AnswerEntry {
    questionId: string;
    questionSlug?: string;
    value: AnswerValue;
}

export interface ResponseMetadata {
    userAgent: string;
    ipAddress: string;
    browser?: string;
    os?: string;
    device?: string;
    country?: string;
    timeSpentSeconds?: number;
}

export interface FormResponse {
    formId: string;
    userId: string;
    idempotencyKey: string;

    email?: string;

    answers: AnswerEntry[];
    metadata: ResponseMetadata;

    isCompleted: boolean;
    currentSectionId?: string;

    submittedAt?: Date;
}
