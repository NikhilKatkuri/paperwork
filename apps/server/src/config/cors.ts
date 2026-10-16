import cors from 'cors';
import config from '@/config';

function normalizeOrigin(o: string): string {
    return o.trim().replace(/\/+$/, '').toLowerCase();
}

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, false);

        const allowed = config.origins.urls.map(normalizeOrigin);
        if (allowed.includes(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

export default corsOptions;
