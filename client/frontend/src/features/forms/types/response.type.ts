export interface AnswerEntry {
    questionId: string;
    values: string[];
}

export interface FormResponse {
    _id: string;
    formId: string;
    userId: string;
    email: string;
    answers: AnswerEntry[];
    metadata?: {
        userAgent?: string;
        ipAddress?: string;
    };
    createdAt: string | number;
}

export interface ResponsePagination {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}

export interface ResponseQuestionSummary {
    questionId: string;
    answered: number;
    values: { value: string; count: number }[];
}

export interface ResponseSummary {
    totalResponses: number;
    questions: ResponseQuestionSummary[];
}
