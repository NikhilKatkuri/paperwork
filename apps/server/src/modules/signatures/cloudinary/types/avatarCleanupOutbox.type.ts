import { Document } from 'mongoose';

export type AvatarCleanupJobStatus =
    'pending' | 'processing' | 'done' | 'failed';

export interface AvatarCleanupJob {
    /** Public id of the Cloudinary asset that must be destroyed. */
    publicId: string;
    /** Owner profile, used to verify the asset is not referenced anymore. */
    userId: string;

    status: AvatarCleanupJobStatus;
    attempts: number;
    nextAttemptAt: Date;

    doneAt?: Date;

    lockedAt?: Date | null;
    lockedBy?: string | null;
    lastError?: string;
}

export type AvatarCleanupJobDocument = AvatarCleanupJob & Document;
