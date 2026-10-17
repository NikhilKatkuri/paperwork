import { cacheRedis } from '@/redis';
import FillService from '@/modules/forms/service/service.fill';
import { emailQueue } from '@/queues';
import { Job, UnrecoverableError } from 'bullmq';
import { worker } from '@/workers/index';
import { logError, workerLogger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';

interface SubmissionJob {
    submissionId: string;
    formId: string;
    userId: string;
    email: string;
    answers: { questionId: string; questionSlug?: string; value: string[] }[];
    metadata: { userAgent: string; ipAddress: string };
    idempotencyKey: string;
    isCompleted: boolean;
    currentSectionId?: string;
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

    /**
     * Single-write status update. The base record (submissionId/formId/
     * createdAt) is read once per job in `process` instead of doing a
     * GET-then-SET for every transition.
     */
    private async updateStatus(
        submissionId: string,
        status: 'processing' | 'done' | 'failed',
        extra: Record<string, unknown> = {},
        base: Record<string, unknown> = {}
    ): Promise<void> {
        try {
            await cacheRedis.set(
                submissionKey(submissionId),
                JSON.stringify({
                    submissionId,
                    ...base,
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
        } catch {
            return;
        }
    }

    private async process(job: Job<SubmissionJob>): Promise<void> {
        const {
            submissionId,
            formId,
            userId,
            email,
            answers,
            metadata,
            idempotencyKey,
            isCompleted,
            currentSectionId,
        } = job.data;

        // Idempotency: a retry after a successful write must not double-save.
        // The status record carries responseId once done. The parsed record
        // is reused as the base for subsequent status writes.
        let base: Record<string, unknown> = {};
        try {
            const existing = await cacheRedis.get(submissionKey(submissionId));
            if (existing) {
                try {
                    const parsed = JSON.parse(existing);
                    if (parsed?.status === 'done' && parsed?.responseId) return;
                    if (parsed && typeof parsed === 'object') base = parsed;
                } catch {
                    /* poisoned value: overwrite from scratch */
                }
            }
        } catch {
            /* cache unavailable: proceed */
        }

        // Mark processing
        await this.updateStatus(submissionId, 'processing', {}, base);

        try {
            const response = await this.service.post({
                formId,
                userId,
                email,
                answers,
                metadata,
                idempotencyKey,
                isCompleted,
                currentSectionId,
            });

            if (!response) throw new Error('Failed to save response');

            await this.updateStatus(
                submissionId,
                'done',
                {
                    responseId: response._id.toString(),
                },
                base
            );

            // Trigger email
            await emailQueue.add(
                'submissionConfirmed',
                {
                    submissionId,
                    responseId: response._id.toString(),
                    email,
                    formId,
                    formName: formId,
                },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                }
            );
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

            // 4xx failures (form closed, limit reached, invalid answers)
            // are deterministic: retrying cannot succeed.
            const deterministic =
                error instanceof AppError &&
                error.statusCode >= 400 &&
                error.statusCode < 500;

            const totalAttempts = job.opts.attempts ?? 1;
            const isFinalAttempt = job.attemptsMade + 1 >= totalAttempts;

            if (deterministic || isFinalAttempt) {
                await this.updateStatus(
                    submissionId,
                    'failed',
                    {
                        error: (error as Error).message,
                    },
                    base
                );
            } else {
                /**
                 * Keep the status at `processing` between attempts: marking
                 * it `failed` now would make the polling client give up even
                 * though BullMQ is about to retry and may yet succeed.
                 */
                await this.updateStatus(
                    submissionId,
                    'processing',
                    {
                        lastError: (error as Error).message,
                    },
                    base
                );
            }

            if (deterministic) {
                throw new UnrecoverableError(error.message);
            }

            throw error; // transient (DB/cache) failures retry with backoff
        }
    }
}
export { submissionKey };
export default SubmissionWorker;
