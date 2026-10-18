import { Schema, model, Model } from 'mongoose';
import {
    AvatarCleanupJobDocument,
    AvatarCleanupJobStatus,
} from '../types/avatarCleanupOutbox.type';

const validStatuses: AvatarCleanupJobStatus[] = [
    'pending',
    'processing',
    'done',
    'failed',
];

const avatarCleanupOutboxSchema = new Schema<AvatarCleanupJobDocument>(
    {
        publicId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
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
        doneAt: {
            type: Date,
        },
        lockedAt: {
            type: Date,
            default: null,
        },
        lockedBy: {
            type: String,
            default: null,
        },
        lastError: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'avatar_cleanup_outboxes',
    }
);

avatarCleanupOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
avatarCleanupOutboxSchema.index({ status: 1, lockedAt: 1 });

avatarCleanupOutboxSchema.index(
    { doneAt: 1 },
    {
        expireAfterSeconds: 7 * 24 * 60 * 60,
        partialFilterExpression: { status: 'done' },
    }
);

export const AvatarCleanupOutboxModel: Model<AvatarCleanupJobDocument> =
    model<AvatarCleanupJobDocument>(
        'AvatarCleanupOutbox',
        avatarCleanupOutboxSchema
    );

export default AvatarCleanupOutboxModel;
