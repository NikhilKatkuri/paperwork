import mongoose from 'mongoose';

import config from '@/config';
import { dbLogger, logError } from '@/utils/logger';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;

mongoose.connection.on('connected', () => {
    dbLogger.info('mongodb.connected', {
        event: 'DB_CONNECTED',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
    });
});

mongoose.connection.on('disconnected', () => {
    // Informational, not actionable on its own: the driver reconnects.
    dbLogger.warn('mongodb.disconnected', {
        event: 'DB_DISCONNECTED',
        readyState: mongoose.connection.readyState,
    });
});

mongoose.connection.on('error', (error: Error) => {
    logError(dbLogger, 'mongodb.connection_error', error, {
        event: 'DB_CONNECTION_ERROR',
        readyState: mongoose.connection.readyState,
    });
});

async function connectDB(retries = MAX_RETRIES): Promise<void> {
    try {
        await mongoose.connect(config.mongo.uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (error) {
        if (retries === 0) {
            dbLogger.error('mongodb.max_retries_reached', {
                event: 'DB_MAX_RETRIES_REACHED',
                error,
            });
            process.exit(1);
        }

        dbLogger.warn('mongodb.connect_retry_scheduled', {
            event: 'DB_CONNECT_RETRY',
            retriesLeft: retries,
            retryInMs: RETRY_DELAY_MS,
        });

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return connectDB(retries - 1);
    }
}

async function disconnectDB(): Promise<void> {
    await mongoose.connection.close();
    dbLogger.info('mongodb.closed', { event: 'DB_CLOSED' });
}

export { connectDB, disconnectDB };
