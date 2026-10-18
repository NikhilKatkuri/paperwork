import { Worker, WorkerOptions, Processor } from 'bullmq';
import { redisConnection } from '@/redis';

class WorkerManager {
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
}

const worker = new WorkerManager();
export { worker };
export default WorkerManager;
