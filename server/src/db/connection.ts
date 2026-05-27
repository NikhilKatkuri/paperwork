import mongoose from 'mongoose';
import config from '@/config';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;

mongoose.connection.on('connected', () => {
    console.log('[db] connected to mongodb');
});

mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected from mongodb');
});

mongoose.connection.on('error', (err: Error) => {
    console.error('[db] connection error:', err.message);
});

async function connectDB(retries = MAX_RETRIES): Promise<void> {
    try {
        await mongoose.connect(config.mongo.uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (err) {
        if (retries === 0) {
            console.error('[db] max retries reached, exiting process');
            process.exit(1);
        }
        console.warn(
            `[db] connection failed, retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`
        );
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        return connectDB(retries - 1);
    }
}

async function disconnectDB(): Promise<void> {
    await mongoose.connection.close();
    console.log('[db] connection closed gracefully');
}

export { connectDB, disconnectDB };
