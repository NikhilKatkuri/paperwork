import { Worker, WorkerOptions, Processor, Job } from 'bullmq';
import MailService from '@/utils/mail';
import { AppError } from '@/utils/AppError';
import { redisConnection } from '@/redis';
import { logError, workerLogger } from '@/utils/logger';

class WorkerManager {
    private readonly mailservice = new MailService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            WorkerManager.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    createWorker(
        name: string,
        processor: Processor,
        opts: Omit<WorkerOptions, 'connection'> = {}
    ) {
        return new Worker(name, processor, {
            ...opts,
            connection: redisConnection,
        });
    }

    onWorkerError(worker: Worker, callback: (err: Error) => void) {
        worker.on('error', callback);
    }

    onWorkerFailed(worker: Worker, callback: (job: any, err: Error) => void) {
        worker.on('failed', (job, err) => callback(job, err));
    }

    private getBoxConfig(): Record<string, (job: Job) => Promise<any>> {
        return {
            sendWelcomeEmail: (job) =>
                this.mailservice.sendWelcomeEmail(
                    job.data.email,
                    job.data.fullName
                ),
            sendLoginAlertEmail: (job) =>
                this.mailservice.sendLoginAlertEmail(
                    job.data.email,
                    job.data.device,
                    job.data.location,
                    job.data.time
                ),
            sendVerificationEmail: (job) =>
                this.mailservice.sendOTPEmail(
                    job.data.email,
                    String(job.data.otp).padStart(6, '0'),
                    `Your Verification Code - Expires at ${new Date(job.data.expiresAt).toLocaleString()}`
                ),
            sendPasswordChangeAlertEmail: (job) =>
                this.mailservice.sendPasswordChangeAlertEmail(
                    job.data.email,
                    job.data.time
                ),
            sendForgotPasswordEmail: (job) =>
                this.mailservice.sendForgotPasswordEmail(
                    job.data.email,
                    job.data.resetLink
                ),
            sendPasswordResetSuccessEmail: (job) =>
                this.mailservice.sendPasswordResetSuccessEmail(job.data.email),
            sendFormCreatedEmail: (job) =>
                this.mailservice.sendFormCreatedEmail(
                    job.data.email,
                    job.data.formName,
                    job.data.formId
                ),
            submissionConfirmed: (job) =>
                this.mailservice.sendFormSubmissionConfirmedEmail(
                    job.data.email,
                    job.data.formId,
                    job.data.submissionId
                ),
        };
    }

    initEmailWorker() {
        const emailWorker = this.createWorker(
            'email',
            async (job: Job) => {
                try {
                    const configMap = this.getBoxConfig();
                    const fn = configMap[job.name];

                    if (!fn) {
                        throw AppError.Internal(
                            `No processor found for job: ${job.name}`
                        );
                    }

                    await fn(job);
                } catch (error) {
                    // Re-thrown so BullMQ applies its retry policy, but logged
                    // first with the job identity attached — otherwise a job
                    // that exhausts its attempts leaves no trace beyond a
                    // generic worker error.
                    logError(workerLogger, 'email_job.failed', error, {
                        event: 'QUEUE_JOB_FAILED',
                        jobId: job.id,
                        jobName: job.name,
                        attempt: job.attemptsMade,
                    });
                    throw error;
                }
            },
            {
                concurrency: 1,
                drainDelay: 10,
            }
        );

        this.onWorkerError(emailWorker, (err) => {
            logError(workerLogger, 'email_worker.error', err, {
                event: 'WORKER_ERROR',
                queue: 'email',
            });
        });

        this.onWorkerFailed(emailWorker, (job, err) => {
            logError(workerLogger, 'email_worker.job_failed', err, {
                event: 'QUEUE_JOB_ABANDONED',
                queue: 'email',
                jobId: job?.id,
                jobName: job?.name,
            });
        });

        workerLogger.info('email_worker.mounted', {
            event: 'WORKER_MOUNTED',
            queue: 'email',
            concurrency: 1,
        });
    }
}

const worker = new WorkerManager();
export { worker };
export default WorkerManager;
