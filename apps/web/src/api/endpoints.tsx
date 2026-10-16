export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface EndpointConfig {
    path: string;
    method: HttpMethod;
}

export interface ResponseQuery {
    page: number;
    limit: number;
    q?: string;
    questionId?: string;
    sort?: 'newest' | 'oldest';
}

/**
 * Build a query string, skipping empty values so the URL stays clean.
 */
function toQuery(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') return;
        search.set(key, String(value));
    });

    const query = search.toString();

    return query ? `?${query}` : '';
}

export const endpoints = {
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        signOut: '/auth/sign-out',
        refreshToken: '/auth/refresh-token',
        me: '/auth/me',
        sendVerification: '/auth/send-verification',
        verifyEmail: '/auth/verify-email',
        changePassword: '/auth/change-password',
        forgotPassword: '/auth/forgot-password',
        checkEmailExists: '/auth/check-email',
        action: {
            path: '/auth/account/action',
            types: {
                enableTwoFactor: 'enable-2fa',
                disableTwoFactor: 'disable-2fa',
            },
        },
        accountAction: '/auth/account/action',
        account: '/auth/account',
        sensitiveInfo: '/auth/account/personal',
        resetPassword: (token: string): string =>
            `/auth/reset-password/${encodeURIComponent(token)}`,
        verifyTwoFactor: (otp: string): string =>
            `/auth/sign-in/2fa/${encodeURIComponent(otp)}`,
    },
    signature: {
        cloudinary: '/cloudinary/signature',
    },
    forms: {
        allForms: (page:number = 1, limit: number = 50): string => `/forms?limit=${limit}&page=${page}`,
        getFormById: (formId: string): string => `/forms/${formId}`,
        createForm: '/forms',
        updateForm: (formId: string): string => `/forms/${formId}`,
        bulkUpdateForm: (formId: string): string => `/forms/${formId}/bulk`,
        deleteForm: (formId: string): string => `/forms/${formId}`,
        fill: (formId: string): string => `/forms/${formId}/fill`,
        submitFill: (formId: string): string => `/forms/${formId}/fill`,
        submissionStatus: (formId: string, submissionId: string): string =>
            `/forms/${formId}/fill/submissions/${submissionId}/status`,
        publishForm: (formId: string): string => `/forms/${formId}/publish`,
        unpublishForm: (formId: string): string => `/forms/${formId}/unpublish`,
        searchForms: (q: string, limit: number = 10): string =>
            `/forms/search${toQuery({ q, limit })}`,
        formById: (formId: string): string => `/forms/${formId}`,
        formResponses: (formId: string, query: ResponseQuery): string =>
            `/forms/${formId}/fill/responses${toQuery({
                page: query.page,
                limit: query.limit,
                q: query.q,
                questionId: query.questionId,
                sort: query.sort,
            })}`,
        formResponsesSummary: (
            formId: string,
            query: { q?: string; questionId?: string }
        ): string =>
            `/forms/${formId}/fill/responses/summary${toQuery({
                q: query.q,
                questionId: query.questionId,
            })}`,
    },
} as const;
