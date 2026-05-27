import app from './app';
import config from '@/config';
import { connectDB, disconnectDB } from '@/db/connection';

const boot = async (): Promise<void> => {
    await connectDB();
    const server = app.listen(config.port, () => {
        console.log(
            `[server] running on port ${config.port} in ${config.env} mode`
        );
    });

    const shutdown = async (signal: string): Promise<void> => {
        console.log(`[server] ${signal} received, shutting down gracefully`);
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason: unknown) => {
        console.error('[server] unhandled rejection:', reason);
        process.exit(1);
    });
};

boot();
