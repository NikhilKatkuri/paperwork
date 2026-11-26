import { randomUUID } from 'crypto';
import { FORM_BIN_RETENTION_DAYS } from '@paperwork/types';
import AutoBoundClass from '@/utils/AutoBoundClass';
import FormsService from '../service/service.forms';
import { logError, workerLogger } from '@/utils/logger';

const FIRST_RUN_DELAY_MS = 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Retention sweep for the form bin. Forms left in the bin for more than
 * `FORM_BIN_RETENTION_DAYS` are removed permanently, along with their sections
 * and questions. Runs on a timer so cleanup does not depend on a user visiting
 * the bin UI. `purgeOnce` is public so tests can drive one iteration.
 */
class FormBinCleanupWorker extends AutoBoundClass {
    private readonly workerId = randomUUID();
    private readonly service = new FormsService();
    private running = false;
    private timer: ReturnType<typeof setTimeout> | null = null;

    start(): void {
        if (this.running) return;

        this.running = true;
        workerLogger.info('form_bin_cleanup_worker.started', {
            event: 'FORM_BIN_CLEANUP_WORKER_STARTED',
            workerId: this.workerId,
            retentionDays: FORM_BIN_RETENTION_DAYS,
        });

        this.timer = setTimeout(() => void this.tick(), FIRST_RUN_DELAY_MS);
    }

    stop(): void {
        this.running = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    async purgeOnce(): Promise<number> {
        return this.service.purgeExpired(FORM_BIN_RETENTION_DAYS);
    }

    private async tick(): Promise<void> {
        if (!this.running) return;

        try {
            const purged = await this.purgeOnce();
            if (purged > 0) {
                workerLogger.warn('form_bin_cleanup_worker.purged', {
                    event: 'FORM_BIN_CLEANUP_PURGED',
                    workerId: this.workerId,
                    purged,
                    retentionDays: FORM_BIN_RETENTION_DAYS,
                });
            }
        } catch (error) {
            logError(workerLogger, 'form_bin_cleanup_worker.failed', error, {
                event: 'FORM_BIN_CLEANUP_FAILED',
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

const formBinCleanupWorker = new FormBinCleanupWorker();
export default formBinCleanupWorker;
