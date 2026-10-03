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
 * Build a query string, skipping empty values so the URL stays clean and the
 * server's own defaults apply to anything omitted.
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
        signIn: { path: '/auth/sign-in', method: 'POST' },
        signUp: { path: '/auth/sign-up', method: 'POST' },
        signOut: { path: '/auth/sign-out', method: 'POST' },
        refreshToken: { path: '/auth/refresh-token', method: 'POST' },
        me: { path: '/auth/me', method: 'GET' },
        sendVerification: { path: '/auth/send-verification', method: 'POST' },
        verifyEmail: { path: '/auth/verify-email', method: 'POST' },
        changePassword: { path: '/auth/change-password', method: 'POST' },
        forgotPassword: { path: '/auth/forgot-password', method: 'POST' },
        checkEmailExists: { path: '/auth/check-email', method: 'POST' },
        action: {
            path: '/auth/account/action',
            method: 'POST',
            types: {
                enableTwoFactor: 'enable-2fa',
                disableTwoFactor: 'disable-2fa',
            },
        },
        accountAction: {
            path: '/auth/account/action',
            method: 'POST',
        },
        account: {
            path: '/auth/account',
            method: 'GET',
        },
        sensitiveInfo: {
            path: '/auth/account/personal',
        },
        resetPassword: (token: string): EndpointConfig => ({
            path: `/auth/reset-password/${token}`,
            method: 'POST',
        }),
        verifyTwoFactor: (otp: string): EndpointConfig => ({
            path: `/auth/sign-in/2fa/${otp}`,
            method: 'POST',
        }),
    },
    signature: {
        cloudinary: { path: '/cloudinary/signature', method: 'GET' },
    },
    forms: {
        allForms: { path: '/forms', method: 'GET' },
        createForm: { path: '/forms', method: 'POST' },
        updateForm: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}`,
            method: 'PUT',
        }),
        bulkUpdateForm: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}/bulk`,
            method: 'PUT',
        }),
        deleteForm: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}`,
            method: 'DELETE',
        }),
        fill: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}/fill`,
            method: 'GET',
        }),
        submitFill: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}/fill`,
            method: 'POST',
        }),
        submissionStatus: (
            formId: string,
            submissionId: string
        ): EndpointConfig => ({
            path: `/forms/${formId}/fill/submissions/${submissionId}/status`,
            method: 'GET',
        }),
        publishForm: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}/publish`,
            method: 'POST',
        }),
        unpublishForm: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}/unpublish`,
            method: 'POST',
        }),
        searchForms: (q: string, limit: number = 10): EndpointConfig => ({
            path: `/forms/search${toQuery({ q, limit })}`,
            method: 'GET',
        }),
        formById: (formId: string): EndpointConfig => ({
            path: `/forms/${formId}`,
            method: 'GET',
        }),
        formResponses: (
            formId: string,
            query: ResponseQuery
        ): EndpointConfig => ({
            path: `/forms/${formId}/fill/responses${toQuery({
                page: query.page,
                limit: query.limit,
                q: query.q,
                questionId: query.questionId,
                sort: query.sort,
            })}`,
            method: 'GET',
        }),
        formResponsesSummary: (
            formId: string,
            query: { q?: string; questionId?: string }
        ): EndpointConfig => ({
            path: `/forms/${formId}/fill/responses/summary${toQuery({
                q: query.q,
                questionId: query.questionId,
            })}`,
            method: 'GET',
        }),
    },
} as const;
