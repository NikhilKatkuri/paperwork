import { Document } from 'mongoose';

export enum EmailPriority {
    OTP = 10,
    PASSWORD_RESET = 8,
    SECURITY_ALERT = 6,
    FORM_SUBMISSION_CONFIRMATION = 4,
    WELCOME = 2,
    FORM_CREATED = 1,
    DEFAULT = 0,
}

export type EmailJobType =
    | 'sendOTPEmail'
    | 'sendWelcomeEmail'
    | 'sendFormCreatedEmail'
    | 'sendForgotPasswordEmail'
    | 'sendPasswordResetSuccessEmail'
    | 'sendLoginAlertEmail'
    | 'sendPasswordChangeAlertEmail'
    | 'sendFormSubmissionConfirmedEmail';

export type EmailJobPayloads = {
    sendOTPEmail: {
        email: string;
        otp: string;
        subject?: string;
    };
    sendWelcomeEmail: {
        email: string;
        name: string;
    };
    sendFormCreatedEmail: {
        email: string;
        formName: string;
        formId: string;
    };
    sendForgotPasswordEmail: {
        email: string;
        resetLink: string;
    };
    sendPasswordResetSuccessEmail: {
        email: string;
    };
    sendLoginAlertEmail: {
        email: string;
        device: string;
        location: string;
        time: string;
        /** Client IP, masked on the server before it reaches the outbox. */
        ip?: string;
    };
    sendPasswordChangeAlertEmail: {
        email: string;
        time: string;
    };
    sendFormSubmissionConfirmedEmail: {
        email: string;
        formName: string;
        submissionId: string;
        responseId: string;
        formId: string;
    };
};

export type EmailOutboxJob = {
    [K in EmailJobType]: {
        type: K;
        payload: EmailJobPayloads[K];
        priority?: number;
    };
}[EmailJobType];

export type status = 'pending' | 'processing' | 'sent' | 'failed';

export interface EmailOutbox {
    type: EmailJobType;
    payload: EmailJobPayloads[EmailJobType];

    status: status;
    attempts: number;
    nextAttemptAt: Date;
    priority: number;

    sentAt?: Date;

    lockedAt?: Date;
    lockedBy?: string;
    lastError?: string;
}

export type EmailOutboxDocument = EmailOutbox & Document;
