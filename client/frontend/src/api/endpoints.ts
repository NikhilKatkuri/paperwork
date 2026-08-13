export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface EndpointConfig {
    path: string;
    method: HttpMethod;
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
            path: `/auth/sign-in/2fa/${otp} `,
            method: 'POST',
        }),
    },
    signature: {
        cloudinary: { path: '/cloudinary/signature', method: 'GET' },
    },
    forms: {
        allForms: { path: '/forms', method: 'get' },
    },
} as const;
