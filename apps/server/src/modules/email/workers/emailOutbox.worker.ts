import AutoBoundClass from '@/utils/AutoBoundClass';
import { randomUUID } from 'crypto';
import emailOutboxService from '../services/emailOutbox.service';
import mailService from '@/utils/mail';
import { logError, workerLogger } from '@/utils/logger';

const IDLE_POLL_MS = 1000;
const POLL_FAILURE_MS = 2000;
const LEASE_RELEASE_INTERVAL_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Background delivery loop for the Mongo email outbox.
 *
 * Claims one job at a time with an atomic lease, sends it, and either
 * completes it or schedules a backed-off retry. Stale leases (a crashed
 * worker's `processing` rows) are recovered periodically. `processNextJob`
 * is public so tests can drive single iterations without starting the loop.
 */
class EmailOutboxWorker extends AutoBoundClass {
    private readonly workerId = randomUUID();
    private running = false;
    private lastLeaseReleaseAt = 0;

    async start() {
        if (this.running) return;

        this.running = true;

        workerLogger.info('email_outbox_worker.started', {
            event: 'EMAIL_OUTBOX_WORKER_STARTED',
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
                    'email_outbox_worker.poll_failed',
                    error,
                    {
                        event: 'EMAIL_OUTBOX_WORKER_POLL_FAILED',
                        workerId: this.workerId,
                    }
                );

                await sleep(POLL_FAILURE_MS);
            }
        }

        workerLogger.info('email_outbox_worker.stopped', {
            event: 'EMAIL_OUTBOX_WORKER_STOPPED',
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

        const released = await emailOutboxService.releaseStaleJobs();

        if (released > 0) {
            workerLogger.warn('email_outbox_worker.leases_released', {
                event: 'EMAIL_OUTBOX_LEASES_RELEASED',
                workerId: this.workerId,
                released,
            });
        }
    }

    /**
     * Claims and processes at most one due email job.
     *
     * @returns `true` when a job was claimed, `false` when the queue is empty.
     */
    async processNextJob(): Promise<boolean> {
        const job = await emailOutboxService.getNextPendingJob(this.workerId);

        if (!job) return false;

        const jobId = job._id.toString();

        try {
            await mailService.sendOutboxEmail(job.type, job.payload);

            const sent = await emailOutboxService.markAsSent(
                jobId,
                this.workerId
            );

            if (!sent) {
                // The lease was lost while the provider call was in flight
                // (stale-lease recovery reclaimed the job). The email may be
                // delivered twice; failing to record anything would silently
                // lose the fact that this attempt happened at all.
                workerLogger.warn('email_outbox_job.sent_unconfirmed', {
                    event: 'EMAIL_OUTBOX_JOB_SENT_UNCONFIRMED',
                    workerId: this.workerId,
                    jobId,
                    jobType: job.type,
                });

                return true;
            }

            workerLogger.info('email_outbox_job.sent', {
                event: 'EMAIL_OUTBOX_JOB_SENT',
                workerId: this.workerId,
                jobId,
                jobType: job.type,
            });
        } catch (error) {
            logError(workerLogger, 'email_outbox_job.failed', error, {
                event: 'EMAIL_OUTBOX_JOB_FAILED',
                workerId: this.workerId,
                jobId,
                jobType: job.type,
            });

            await emailOutboxService.markAsFailed(jobId, this.workerId, error);
        }

        return true;
    }
}

const emailOutboxWorker = new EmailOutboxWorker();

export default emailOutboxWorker;
