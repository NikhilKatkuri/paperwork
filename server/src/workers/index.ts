import { Worker, WorkerOptions, Processor } from 'bullmq';
import config from '@/config/index';
import MailService from '@/utils/mail';

class WorkerManager {
    private connection = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    };
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

        console.log('[WorkerManager] initialized with methods:', methods);
    }

    createWorker(
        name: string,
        processor: Processor,
        opts: Omit<WorkerOptions, 'connection'> = {}
    ) {
        return new Worker(name, processor, {
            ...opts,
            connection: this.connection,
        });
    }

    onWorkerError(worker: Worker, callback: (err: Error) => void) {
        worker.on('error', callback);
    }

    onWorkerFailed(worker: Worker, callback: (job: any, err: Error) => void) {
        worker.on('failed', (job, err) => callback(job, err));
    }

    initEmailWorker() {
        this.createWorker('email', async (job) => {
            const mailservice = new MailService();
            if (job.name === 'sendWelcomeEmail') {
                console.log('[WorkerManager] processing sendWelcomeEmail job:', job.data);
                const { email, fullName } = job.data;
                await mailservice.sendWelcomeEmail(email, fullName);
                return;
            }
        });
    }
}

export default WorkerManager;
