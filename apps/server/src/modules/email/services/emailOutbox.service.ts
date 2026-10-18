import AutoBoundClass from '@/utils/AutoBoundClass';
import { EmailOutboxJob } from '../types/emailOutbox.type';
import { ClientSession } from 'mongoose';
import { EmailOutboxModel } from '../schema/emailOutbox.model';

class EmailOutboxService extends AutoBoundClass {
    async addEmailToOutbox(job: EmailOutboxJob, session?: ClientSession) {
        const emailJob = new EmailOutboxModel({
            ...job,
            status: 'pending',
            attempts: 0,
            priority:
                'priority' in job && typeof job.priority === 'number'
                    ? job.priority
                    : 0,
            nextAttemptAt: new Date(),
            lockedAt: null,
            lockedBy: null,
        });

        await emailJob.save({ session });

        return emailJob;
    }
    async getNextPendingJob(workerId: string, session?: ClientSession) {
        const now = new Date();

        return EmailOutboxModel.findOneAndUpdate(
            {
                status: 'pending',
                nextAttemptAt: { $lte: now },
                attempts: { $lt: 5 },
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
                sort: { priority: -1, nextAttemptAt: 1, createdAt: 1 },
                session,
                returnDocument: 'after',
            }
        );
    }

    async markAsSent(emailJobId: string, workerId: string) {
        return EmailOutboxModel.findOneAndUpdate(
            {
                _id: emailJobId,
                status: 'processing',
                lockedBy: workerId,
            },
            {
                $set: {
                    status: 'sent',
                    sentAt: new Date(),
                    lockedAt: null,
                    lockedBy: null,
                },
            },
            { returnDocument: 'after' }
        );
    }

    async markAsFailed(emailJobId: string, workerId: string, error: unknown) {
        const job = await EmailOutboxModel.findOne({
            _id: emailJobId,
            status: 'processing',
            lockedBy: workerId,
        });

        if (!job) return null;

        const exhausted = job.attempts >= 5;
        const message = error instanceof Error ? error.message : String(error);

        return EmailOutboxModel.findOneAndUpdate(
            { _id: emailJobId, status: 'processing', lockedBy: workerId },
            {
                $set: {
                    status: exhausted ? 'failed' : 'pending',
                    lastError: message,
                    nextAttemptAt: exhausted
                        ? job.nextAttemptAt
                        : new Date(
                              Date.now() +
                                  Math.min(
                                      60_000 * 2 ** (job.attempts - 1),
                                      3_600_000
                                  )
                          ),
                    lockedAt: null,
                    lockedBy: null,
                },
            },
            { returnDocument: 'after' }
        );
    }

    async releaseStaleJobs() {
        const staleThreshold = new Date(Date.now() - 5 * 60_000);
        const MAX_ATTEMPTS = 5;

        const exhausted = await EmailOutboxModel.updateMany(
            {
                status: 'processing',
                lockedAt: { $lte: staleThreshold },
                attempts: { $gte: MAX_ATTEMPTS },
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

        const retryable = await EmailOutboxModel.updateMany(
            {
                status: 'processing',
                lockedAt: { $lte: staleThreshold },
                attempts: { $lt: MAX_ATTEMPTS },
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

    async getJobById(emailJobId: string, session?: ClientSession) {
        return EmailOutboxModel.findById(emailJobId).session(session ?? null);
    }

    async deleteExpiredJobs(session?: ClientSession) {
        const expirationThreshold = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
        ); // 7 days ago

        const result = await EmailOutboxModel.deleteMany(
            {
                status: 'sent',
                sentAt: { $lte: expirationThreshold },
            },
            { session }
        );

        return result.deletedCount;
    }
}

const emailOutboxService = new EmailOutboxService();
export default emailOutboxService;
