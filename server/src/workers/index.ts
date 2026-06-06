import { Worker, WorkerOptions, Processor, Job } from 'bullmq';
import MailService from '@/utils/mail';
import { AppError } from '@/utils/AppError';
import { redisConnection } from '@/redis';

class WorkerManager {
    private mailservice = new MailService();

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
                    String(job.data.otp).padStart(6, '0')
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
        this.createWorker('email', async (job: Job) => {
            try {
                const configMap = this.getBoxConfig();
                const fn = configMap[job.name];

                if (!fn) {
                    console.error(
                        `[WorkerManager] No processor found for job: ${job.name}`
                    );
                    throw AppError.Internal(
                        `No processor found for job: ${job.name}`
                    );
                }

                await fn(job);
            } catch (error: any) {
                console.error(
                    `[WorkerManager] Job ${job.id} (${job.name}) failed execution:`,
                    error.message
                );

                throw error;
            }
        });

        console.log('[WorkerManager] Email worker successfully mounted.');
    }
}
const worker = new WorkerManager();
export { worker };
export default WorkerManager;
