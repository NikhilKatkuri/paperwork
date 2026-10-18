import { Schema, model, Model } from 'mongoose';
import {
    EmailJobType,
    EmailOutboxDocument,
    status,
} from '../types/emailOutbox.type';

const validJobTypes: EmailJobType[] = [
    'sendOTPEmail',
    'sendWelcomeEmail',
    'sendFormCreatedEmail',
    'sendForgotPasswordEmail',
    'sendPasswordResetSuccessEmail',
    'sendLoginAlertEmail',
    'sendPasswordChangeAlertEmail',
    'sendFormSubmissionConfirmedEmail',
];

const validStatuses: status[] = ['pending', 'processing', 'sent', 'failed'];

const emailOutboxSchema = new Schema<EmailOutboxDocument>(
    {
        type: {
            type: String,
            required: true,
            enum: validJobTypes,
            index: true,
        },
        payload: {
            type: Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: validStatuses,
            default: 'pending',
            index: true,
        },
        attempts: {
            type: Number,
            required: true,
            default: 0,
        },
        nextAttemptAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        priority: {
            type: Number,
            required: true,
            default: 0,
            index: true,
        },
        sentAt: {
            type: Date,
        },
        lockedAt: {
            type: Date,
        },
        lockedBy: {
            type: String,
        },
        lastError: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'email_outboxes',
    }
);

emailOutboxSchema.index({ status: 1, nextAttemptAt: 1, priority: -1 });
emailOutboxSchema.index({
    status: 1,
    priority: -1,
    nextAttemptAt: 1,
    createdAt: 1,
});

emailOutboxSchema.index({
    status: 1,
    lockedAt: 1,
});

emailOutboxSchema.index(
    { sentAt: 1 },
    {
        expireAfterSeconds: 7 * 24 * 60 * 60,
        partialFilterExpression: { status: 'sent' },
    }
);
export const EmailOutboxModel: Model<EmailOutboxDocument> =
    model<EmailOutboxDocument>('EmailOutbox', emailOutboxSchema);

export default EmailOutboxModel;
