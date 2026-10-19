import AutoBoundClass from '@/utils/AutoBoundClass';
import { EmailOutboxJob } from '../types/emailOutbox.type';
import { ClientSession } from 'mongoose';
import { EmailOutboxModel } from '../schema/emailOutbox.model';

const SECRET_PAYLOAD_KEYS = new Set(['otp', 'resetLink', 'token']);

class EmailOutboxService extends AutoBoundClass {
    /**
     * Removes one-time credentials from a job payload once the job is sent
     * or permanently failed. A delivered OTP/reset link is useless to the
     * recipient by then, but at rest in Mongo it stays valid for its lifetime
     * — a database read must not expose working credentials.
     *
     * @returns a copy without secret keys, or `null` when nothing to scrub.
     */
    private scrubSecretPayload(
        payload: unknown
    ): Record<string, unknown> | null {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return null;
        }
        const entries = Object.entries(payload as Record<string, unknown>);
        if (!entries.some(([key]) => SECRET_PAYLOAD_KEYS.has(key))) return null;
        return Object.fromEntries(
            entries.filter(([key]) => !SECRET_PAYLOAD_KEYS.has(key))
        );
    }

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
        const job = await EmailOutboxModel.findOneAndUpdate(
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

        if (!job) return null;

        const scrubbed = this.scrubSecretPayload((job as any).payload);
        if (scrubbed) {
            await EmailOutboxModel.updateOne(
                { _id: emailJobId },
                { $set: { payload: scrubbed } }
            );
            (job as any).payload = scrubbed;
        }

        return job;
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
        const scrubbed = exhausted
            ? this.scrubSecretPayload((job as any).payload)
            : null;

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
                    ...(scrubbed && { payload: scrubbed }),
                },
            },
            { returnDocument: 'after' }
        );
    }

    async releaseStaleJobs() {
        const staleThreshold = new Date(Date.now() - 5 * 60_000);
        const MAX_ATTEMPTS = 5;

        /**
         * Exhausted leases are transitioned one by one (instead of a bulk
         * update) so their payload secrets can be scrubbed — a permanently
         * failed job must not keep a working OTP or reset link at rest. The
         * status/lock guard prevents racing a worker that recovered the job.
         */
        const exhaustedJobs = await EmailOutboxModel.find({
            status: 'processing',
            lockedAt: { $lte: staleThreshold },
            attempts: { $gte: MAX_ATTEMPTS },
        })
            .select('_id payload')
            .lean();

        let exhaustedCount = 0;
        for (const job of exhaustedJobs) {
            const scrubbed = this.scrubSecretPayload(job.payload);
            const result = await EmailOutboxModel.updateOne(
                {
                    _id: job._id,
                    status: 'processing',
                    lockedAt: { $lte: staleThreshold },
                },
                {
                    $set: {
                        status: 'failed',
                        lastError:
                            'Worker lease expired; retry limit exhausted',
                        lockedAt: null,
                        lockedBy: null,
                        ...(scrubbed && { payload: scrubbed }),
                    },
                }
            );
            exhaustedCount += result.modifiedCount;
        }

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

        return exhaustedCount + retryable.modifiedCount;
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
