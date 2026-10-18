import AutoBoundClass from '@/utils/AutoBoundClass';
import { AvatarCleanupOutboxModel } from '../schema/avatarCleanupOutbox.model';

/** Claims allowed before a cleanup job is parked as permanently failed. */
export const AVATAR_CLEANUP_MAX_ATTEMPTS = 5;

/** A `processing` lease older than this is presumed abandoned. */
export const AVATAR_CLEANUP_LEASE_MS = 5 * 60_000;

const BACKOFF_BASE_MS = 60_000;
const BACKOFF_CAP_MS = 60 * 60_000;

const messageOf = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/**
 * Durable outbox for avatar assets whose inline deletion failed.
 *
 * Mirrors the email outbox pattern: jobs are claimed with an atomic lease,
 * retried with exponential backoff by an in-process worker, and recoverable
 * after a crash via `releaseStaleJobs`.
 */
class AvatarCleanupOutboxService extends AutoBoundClass {
    async enqueue(input: {
        publicId: string;
        userId: string;
        error?: unknown;
    }) {
        return AvatarCleanupOutboxModel.create({
            publicId: input.publicId,
            userId: input.userId,
            status: 'pending',
            attempts: 0,
            nextAttemptAt: new Date(),
            lockedAt: null,
            lockedBy: null,
            lastError:
                input.error === undefined ? undefined : messageOf(input.error),
        });
    }

    async getNextPendingJob(workerId: string) {
        const now = new Date();

        return AvatarCleanupOutboxModel.findOneAndUpdate(
            {
                status: 'pending',
                nextAttemptAt: { $lte: now },
                attempts: { $lt: AVATAR_CLEANUP_MAX_ATTEMPTS },
            },
            {
                $set: {
                    status: 'processing',
                    lockedAt: now,
                    lockedBy: workerId,
                },
                $inc: { attempts: 1 },
            },
            {
                sort: { nextAttemptAt: 1, createdAt: 1 },
                returnDocument: 'after',
            }
        );
    }

    async markAsDone(jobId: string, workerId: string) {
        return AvatarCleanupOutboxModel.findOneAndUpdate(
            {
                _id: jobId,
                status: 'processing',
                lockedBy: workerId,
            },
            {
                $set: {
                    status: 'done',
                    doneAt: new Date(),
                    lockedAt: null,
                    lockedBy: null,
                },
            },
            { returnDocument: 'after' }
        );
    }

    async markAsFailed(jobId: string, workerId: string, error: unknown) {
        const job = await AvatarCleanupOutboxModel.findOne({
            _id: jobId,
            status: 'processing',
            lockedBy: workerId,
        });

        if (!job) return null;

        const exhausted = job.attempts >= AVATAR_CLEANUP_MAX_ATTEMPTS;
        const message = messageOf(error);

        return AvatarCleanupOutboxModel.findOneAndUpdate(
            { _id: jobId, status: 'processing', lockedBy: workerId },
            {
                $set: {
                    status: exhausted ? 'failed' : 'pending',
                    lastError: message,
                    nextAttemptAt: exhausted
                        ? job.nextAttemptAt
                        : new Date(
                              Date.now() +
                                  Math.min(
                                      BACKOFF_BASE_MS * 2 ** (job.attempts - 1),
                                      BACKOFF_CAP_MS
                                  )
                          ),
                    lockedAt: null,
                    lockedBy: null,
                },
            },
            { returnDocument: 'after' }
        );
    }

    /**
     * Returns jobs whose worker lease expired (process crash mid-attempt) to
     * the queue, and parks exhausted ones as failed. Without this a crash
     * would strand `processing` rows forever.
     */
    async releaseStaleJobs() {
        const staleThreshold = new Date(Date.now() - AVATAR_CLEANUP_LEASE_MS);

        const exhausted = await AvatarCleanupOutboxModel.updateMany(
            {
                status: 'processing',
                lockedAt: { $lte: staleThreshold },
                attempts: { $gte: AVATAR_CLEANUP_MAX_ATTEMPTS },
            },
            {
                $set: {
                    status: 'failed',
                    lastError: 'Worker lease expired; retry limit exhausted',
                    lockedAt: null,
                    lockedBy: null,
                },
            }
        );

        const retryable = await AvatarCleanupOutboxModel.updateMany(
            {
                status: 'processing',
                lockedAt: { $lte: staleThreshold },
                attempts: { $lt: AVATAR_CLEANUP_MAX_ATTEMPTS },
            },
            {
                $set: {
                    status: 'pending',
                    nextAttemptAt: new Date(),
                    lastError: 'Worker lease expired',
                    lockedAt: null,
                    lockedBy: null,
                },
            }
        );

        return exhausted.modifiedCount + retryable.modifiedCount;
    }
}

const avatarCleanupOutboxService = new AvatarCleanupOutboxService();
export default avatarCleanupOutboxService;
