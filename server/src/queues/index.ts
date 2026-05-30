import { Queue, QueueOptions } from 'bullmq';
import config from '@/config/index';

class QueueManager {
    private connection = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    };
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
        console.log('[QueueManager] initialized with methods:', methods);
    }

    createQueue(name: string, opts: Omit<QueueOptions, 'connection'> = {}) {
        console.log(`[QueueManager] creating queue: ${name} withs opts:`, opts);
        return new Queue(name, { ...opts, connection: this.connection });
    }
}

const emailQueue = new QueueManager().createQueue('email');

export default QueueManager;
export { emailQueue };
