import AutoBoundClass from '@/utils/AutoBoundClass';
import { randomUUID } from 'crypto';
import config from '@/config';
import ProfileRepoBoot from '@/modules/auth/repository/profile.repository';
import { logError, workerLogger } from '@/utils/logger';
import avatarCleanupOutboxService from '../service/avatarCleanupOutbox.service';
import CloudinaryService, {
    CLOUDINARY_EVENTS,
} from '../service/cloudinary.service';
import {
    extractCloudinaryPublicId,
    isOwnedPublicId,
} from '../utils/cloudinary.asset';

const IDLE_POLL_MS = 1000;
const POLL_FAILURE_MS = 2000;
const LEASE_RELEASE_INTERVAL_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Background retry loop for avatar assets whose inline deletion failed.
 *
 * Mirrors the email outbox worker: claims one job at a time with an atomic
 * lease, deletes the asset, and either completes it or schedules a backed
 * off retry. `processNextJob` is public so tests can drive single iterations
 * without starting the loop.
 */
class AvatarCleanupOutboxWorker extends AutoBoundClass {
    private readonly workerId = randomUUID();
    private running = false;
    private lastLeaseReleaseAt = 0;

    private get scope() {
        return {
            cloudName: config.cloudinary.cloud_name,
            folder: config.cloudinary.named_folder,
        };
    }

    async start() {
        if (this.running) return;

        this.running = true;

        workerLogger.info('avatar_cleanup_worker.started', {
            event: 'AVATAR_CLEANUP_WORKER_STARTED',
            workerId: this.workerId,
        });

        while (this.running) {
            try {
                await this.releaseExpiredLeasesIfDue();

                const processed = await this.processNextJob();

                if (!processed) await sleep(IDLE_POLL_MS);
            } catch (error) {
                logError(
                    workerLogger,
                    'avatar_cleanup_worker.poll_failed',
                    error,
                    {
                        event: 'AVATAR_CLEANUP_WORKER_POLL_FAILED',
                        workerId: this.workerId,
                    }
                );

                await sleep(POLL_FAILURE_MS);
            }
        }

        workerLogger.info('avatar_cleanup_worker.stopped', {
            event: 'AVATAR_CLEANUP_WORKER_STOPPED',
            workerId: this.workerId,
        });
    }

    stop() {
        this.running = false;
    }

    private async releaseExpiredLeasesIfDue() {
        const now = Date.now();

        if (now - this.lastLeaseReleaseAt < LEASE_RELEASE_INTERVAL_MS) return;

        this.lastLeaseReleaseAt = now;

        const released = await avatarCleanupOutboxService.releaseStaleJobs();

        if (released > 0) {
            workerLogger.warn('avatar_cleanup_worker.leases_released', {
                event: 'AVATAR_CLEANUP_LEASES_RELEASED',
                workerId: this.workerId,
                released,
            });
        }
    }

    /**
     * Claims and processes at most one due cleanup job.
     *
     * Safety rules enforced here, and re-checked because a job may be
     * retried long after it was queued:
     * - only public ids inside the configured folder are destroyed;
     * - an asset the owner profile references again (the user swapped back)
     *   is never destroyed.
     *
     * @returns `true` when a job was claimed, `false` when the queue is empty.
     */
    async processNextJob(): Promise<boolean> {
        const job = await avatarCleanupOutboxService.getNextPendingJob(
            this.workerId
        );

        if (!job) return false;

        const jobId = job._id.toString();

        try {
            if (!isOwnedPublicId(job.publicId, this.scope.folder)) {
                workerLogger.warn('avatar_cleanup_job.skipped', {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_SKIPPED,
                    reason: 'public_id_not_owned',
                    workerId: this.workerId,
                    jobId,
                    userId: job.userId,
                });

                await avatarCleanupOutboxService.markAsDone(
                    jobId,
                    this.workerId
                );

                return true;
            }

            const profile = await ProfileRepoBoot.findByUserId(job.userId, {
                avatarUrl: 1,
            });
            const currentPublicId = extractCloudinaryPublicId(
                profile?.avatarUrl,
                this.scope
            );

            if (currentPublicId && currentPublicId === job.publicId) {
                workerLogger.warn('avatar_cleanup_job.skipped', {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_SKIPPED,
                    reason: 'currently_referenced',
                    workerId: this.workerId,
                    jobId,
                    userId: job.userId,
                    publicId: job.publicId,
                });

                await avatarCleanupOutboxService.markAsDone(
                    jobId,
                    this.workerId
                );

                return true;
            }

            await CloudinaryService.destroyAsset(job.publicId);

            await avatarCleanupOutboxService.markAsDone(jobId, this.workerId);

            workerLogger.info('avatar_cleanup_job.done', {
                event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_DONE,
                workerId: this.workerId,
                jobId,
                userId: job.userId,
                publicId: job.publicId,
            });
        } catch (error) {
            const failed = await avatarCleanupOutboxService.markAsFailed(
                jobId,
                this.workerId,
                error
            );

            const exhausted = failed?.status === 'failed';
            const meta = {
                workerId: this.workerId,
                jobId,
                userId: job.userId,
                publicId: job.publicId,
                attempts: job.attempts,
                exhausted,
            };

            if (exhausted) {
                // Retries are done and the asset is orphaned: this is the
                // line that demands manual cleanup.
                logError(workerLogger, 'avatar_cleanup_job.exhausted', error, {
                    event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_EXHAUSTED,
                    ...meta,
                });
            } else {
                logError(
                    workerLogger,
                    'avatar_cleanup_job.attempt_failed',
                    error,
                    {
                        event: CLOUDINARY_EVENTS.AVATAR_CLEANUP_ATTEMPT_FAILED,
                        ...meta,
                    }
                );
            }
        }

        return true;
    }
}

const avatarCleanupOutboxWorker = new AvatarCleanupOutboxWorker();

export default avatarCleanupOutboxWorker;
