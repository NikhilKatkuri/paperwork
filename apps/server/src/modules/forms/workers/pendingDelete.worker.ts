import { randomUUID } from 'crypto';
import AutoBoundClass from '@/utils/AutoBoundClass';
import FormsService from '../service/service.forms';
import { logError, workerLogger } from '@/utils/logger';

const FIRST_RUN_DELAY_MS = 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const SLOT_SIZE = 500;
const SLOT_DELAY_MS = 500;
const MAX_SLOTS_PER_RUN = 200;

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

class PendingDeleteWorker extends AutoBoundClass {
    private readonly workerId = randomUUID();
    private readonly service = new FormsService();
    private running = false;
    private timer: ReturnType<typeof setTimeout> | null = null;

    start(): void {
        if (this.running) return;

        this.running = true;
        workerLogger.info('pending_delete_worker.started', {
            event: 'PENDING_DELETE_WORKER_STARTED',
            workerId: this.workerId,
            slotSize: SLOT_SIZE,
        });

        this.timer = setTimeout(() => void this.tick(), FIRST_RUN_DELAY_MS);
    }

    stop(): void {
        this.running = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    async processOnce(maxSlots: number = MAX_SLOTS_PER_RUN): Promise<number> {
        let processed = 0;

        for (let slot = 0; slot < maxSlots; slot++) {
            const removed = await this.service.performPendingDeletes(SLOT_SIZE);
            processed += removed;
            if (removed === 0) break;
            if (slot + 1 < maxSlots) await sleep(SLOT_DELAY_MS);
        }

        return processed;
    }

    private async tick(): Promise<void> {
        if (!this.running) return;

        try {
            const processed = await this.processOnce();
            if (processed > 0) {
                workerLogger.info('pending_delete_worker.processed', {
                    event: 'PENDING_DELETE_WORKER_PROCESSED',
                    workerId: this.workerId,
                    processed,
                });
            }
        } catch (error) {
            logError(workerLogger, 'pending_delete_worker.failed', error, {
                event: 'PENDING_DELETE_WORKER_FAILED',
                workerId: this.workerId,
            });
        } finally {
            if (this.running) {
                this.timer = setTimeout(
                    () => void this.tick(),
                    CLEANUP_INTERVAL_MS
                );
            }
        }
    }
}

const pendingDeleteWorker = new PendingDeleteWorker();
export default pendingDeleteWorker;
