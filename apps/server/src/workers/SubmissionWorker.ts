import { cacheRedis } from '@/redis';
import FillService from '@/modules/forms/service/service.fill';
import { emailQueue } from '@/queues';
import { Job } from 'bullmq';
import { worker } from '@/workers/index';
import { logError, workerLogger } from '@/utils/logger';

interface SubmissionJob {
    submissionId: string;
    formId: string;
    userId: string;
    email: string;
    answers: { questionId: string; values: string[] }[];
    metadata: { userAgent: string; ipAddress: string };
}

const submissionKey = (submissionId: string) => `submission:${submissionId}`;

class SubmissionWorker {
    private readonly service = new FillService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            SubmissionWorker.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );
        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }

        worker.createWorker('submissions', this.process, {
            concurrency: 5,
        });

        workerLogger.info('submission_worker.initialized', {
            event: 'WORKER_MOUNTED',
            queue: 'submissions',
            concurrency: 5,
        });
    }

    private async updateStatus(
        submissionId: string,
        status: 'processing' | 'done' | 'failed',
        extra: Record<string, string> = {}
    ): Promise<void> {
        const current = await cacheRedis.get(submissionKey(submissionId));
        if (!current) return;

        const parsed = JSON.parse(current);
        await cacheRedis.set(
            submissionKey(submissionId),
            JSON.stringify({
                ...parsed,
                status,
                ...extra,
                updatedAt: Date.now(),
            }),
            'EX',
            status === 'done'
                ? 86400 // 24hr
                : status === 'failed'
                  ? 259200 // 72hr
                  : 3600 // 1hr for processing
        );
    }

    private async process(job: Job<SubmissionJob>): Promise<void> {
        const { submissionId, formId, userId, email, answers, metadata } =
            job.data;

        // Mark processing
        await this.updateStatus(submissionId, 'processing');

        try {
            const response = await this.service.post({
                formId,
                userId,
                email,
                answers,
                metadata,
            });

            if (!response) throw new Error('Failed to save response');

            await this.updateStatus(submissionId, 'done', {
                responseId: response._id.toString(),
            });

            // Trigger email
            await emailQueue.add('submissionConfirmed', {
                submissionId,
                responseId: response._id.toString(),
                email,
                formId,
            });
        } catch (error) {
            logError(workerLogger, 'submission_job.failed', error, {
                event: 'QUEUE_JOB_FAILED',
                queue: 'submissions',
                jobId: job.id,
                submissionId,
                formId,
                userId,
                attempt: job.attemptsMade,
            });

            await this.updateStatus(submissionId, 'failed', {
                error: (error as Error).message,
            });
            throw error; // rethrow so BullMQ retries
        }
    }
}
export { submissionKey };
export default SubmissionWorker;
