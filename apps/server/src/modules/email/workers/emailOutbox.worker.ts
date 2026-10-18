import AutoBoundClass from '@/utils/AutoBoundClass';
import { randomUUID } from 'crypto';
import emailOutboxService from '../services/emailOutbox.service';
import mailService from '@/utils/mail';
import { logError, workerLogger } from '@/utils/logger';

class EmailOutboxWorker extends AutoBoundClass {
    private readonly workerId = randomUUID();
    private running = false;

    async start() {
        if (this.running) return;

        this.running = true;

        workerLogger.info('email_outbox_worker.started', {
            event: 'EMAIL_OUTBOX_WORKER_STARTED',
            workerId: this.workerId,
        });

        while (this.running) {
            try {
                const job = await emailOutboxService.getNextPendingJob(
                    this.workerId
                );

                if (!job) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }

                const jobId = job._id.toString();

                try {
                    await mailService.sendOutboxEmail(job.type, job.payload);

                    await emailOutboxService.markAsSent(jobId, this.workerId);

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

                    await emailOutboxService.markAsFailed(
                        jobId,
                        this.workerId,
                        error
                    );
                }
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

                await new Promise((resolve) => setTimeout(resolve, 2000));
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
}

const emailOutboxWorker = new EmailOutboxWorker();

export default emailOutboxWorker;
