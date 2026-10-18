import cors from 'cors';
import { CLIENT_METADATA_HEADER } from '@paperwork/types';
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
    // The metadata header must be allowlisted here or every cross-origin
    // request carrying it fails preflight, even though the server accepts it.
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        CLIENT_METADATA_HEADER,
    ],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

export default corsOptions;
