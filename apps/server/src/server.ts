import app from './app';
import config from '@/config';
import { connectDB, disconnectDB } from '@/db/connection';
import SubmissionWorker from './workers/SubmissionWorker';
import { worker } from './workers';
import { fatal, logger } from '@/utils/logger';

const boot = async (): Promise<void> => {
    let server: ReturnType<typeof app.listen>;

    if (config.env === 'production') {
        server = app.listen(config.port, () => {
            logger.info('server.listening', {
                event: 'SERVER_LISTENING',
                port: config.port,
                env: config.env,
                logLevel: config.logger.level,
                requestBodyLogging: config.logger.requestBody,
            });
        });
    } else {
        server = app.listen(config.port, config.host, () => {
            logger.info('server.listening', {
                event: 'SERVER_LISTENING',
                url: `http://${config.host}:${config.port}`,
                env: config.env,
                logLevel: config.logger.level,
                requestBodyLogging: config.logger.requestBody,
            });
        });
    }

    await connectDB().catch((error: unknown) => {
        fatal('database_connection_failed', error);
        process.exit(1);
    });

    worker.initEmailWorker();

    try {
        new SubmissionWorker();
    } catch (error) {
        fatal('submission_worker_failed', error);
        process.exit(1);
    }

    const shutdown = (signal: string): void => {
        logger.info('server.shutdown_started', {
            event: 'SERVER_SHUTDOWN_STARTED',
            signal,
        });

        server.close(async () => {
            try {
                await disconnectDB();
                logger.info('server.shutdown_complete', {
                    event: 'SERVER_SHUTDOWN_COMPLETE',
                    signal,
                });
            } catch (error) {
                fatal('server.shutdown_failed', error);
            } finally {
                process.exit(0);
            }
        });
    };

    process.on('SIGTERM', () =>  shutdown('SIGTERM'));
    process.on('SIGINT', () =>  shutdown('SIGINT'));

    /**
     * Both handlers are bugs by definition: a rejected promise that reaches
     * here, or a throw that escaped every catch. Each is logged with full
     * attribution and stack before the process goes down, so the record
     * survives in the log store rather than only on a console nobody reads.
     */
    process.on('unhandledRejection', (reason: unknown) => {
        fatal('unhandled_rejection', reason);
        process.exit(1);
    });

    process.on('uncaughtException', (error: Error) => {
        fatal('uncaught_exception', error);
        process.exit(1);
    });
};

void boot();
