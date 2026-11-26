import app from './app';
import config from '@/config';
import { connectDB, disconnectDB } from '@/db/connection';
import { fatal, logger } from '@/utils/logger';
import emailOutboxWorker from './modules/email/workers/emailOutbox.worker';
import avatarCleanupOutboxWorker from './modules/signatures/cloudinary/workers/avatarCleanupOutbox.worker';
import formBinCleanupWorker from './modules/forms/workers/formBinCleanup.worker';
import pendingDeleteWorker from './modules/forms/workers/pendingDelete.worker';

const boot = async (): Promise<void> => {
    await connectDB().catch((error: unknown) => {
        fatal('database_connection_failed', error);
        process.exit(1);
    });

    emailOutboxWorker.start();

    avatarCleanupOutboxWorker.start();

    formBinCleanupWorker.start();

    pendingDeleteWorker.start();

    let server: ReturnType<typeof app.listen>;

    const startupInfo = {
        env: config.env,
        logLevel: config.logger.level,
        requestBodyLogging: config.logger.requestBody,
        cookieSecure: config.cookies.secure,
        cookieSameSite: config.cookies.sameSite,
        mailMode: config.mail.mode,
    };

    if (config.env === 'production') {
        server = app.listen(config.port, () => {
            logger.info('server.listening', {
                event: 'SERVER_LISTENING',
                port: config.port,
                ...startupInfo,
            });

            const healthCheckUrl = process.env.HEALTH_CHECK_URL?.trim();
            if (!healthCheckUrl) {
                logger.warn('server.health_check_disabled', {
                    event: 'SERVER_HEALTH_CHECK_DISABLED',
                    reason: 'HEALTH_CHECK_URL_not_set',
                    ...startupInfo,
                });
            } else {
                setInterval(async () => {
                    logger.info('server.still_alive', {
                        event: 'SERVER_STILL_ALIVE',
                        ...startupInfo,
                    });
                    try {
                        const serverStatus = await fetch(healthCheckUrl, {
                            signal: AbortSignal.timeout(5000),
                        });
                        logger.info('server.health_check', {
                            event: 'SERVER_HEALTH_CHECK',
                            status: serverStatus.status,
                            ...startupInfo,
                        });
                    } catch (error) {
                        // A failed self-check must never take the process down:
                        // an unhandled rejection here is fatal by design.
                        logger.error('server.health_check_failed', {
                            event: 'SERVER_HEALTH_CHECK_FAILED',
                            reason: error instanceof Error ? error.message : String(error),
                            ...startupInfo,
                        });
                    }
                }, 60 * 1000).unref();
            }
        });
    } else {
        server = app.listen(config.port, config.host, () => {
            logger.info('server.listening', {
                event: 'SERVER_LISTENING',
                url: `http://${config.host}:${config.port}`,
                ...startupInfo,
            });
        });
    }

    const shutdown = (signal: string): void => {
        logger.info('server.shutdown_started', {
            event: 'SERVER_SHUTDOWN_STARTED',
            signal,
        });

        formBinCleanupWorker.stop();

        pendingDeleteWorker.stop();

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

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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
