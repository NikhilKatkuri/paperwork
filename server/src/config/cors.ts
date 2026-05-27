import cors from 'cors';
import config from '@/config';

const allowedOrigins = config.origins.urls;

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

export default corsOptions;
