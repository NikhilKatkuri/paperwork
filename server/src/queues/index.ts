import { redisConnection } from '@/redis';
import { Queue, QueueOptions } from 'bullmq';

class QueueManager {
    constructor() {
        const methods = Object.getOwnPropertyNames(
            QueueManager.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
        console.log('[QueueManager] initialized successfully');
    }

    createQueue(name: string, opts: Omit<QueueOptions, 'connection'> = {}) {
        return new Queue(name, { ...opts, connection: redisConnection });
    }
}

const manager = new QueueManager();

const emailQueue = manager.createQueue('email');
const submissionQueue = manager.createQueue('submissions', {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export default QueueManager;
export { emailQueue, submissionQueue, manager as queueManager };
