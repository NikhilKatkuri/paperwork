import express from 'express';

import helmet from 'helmet';

import cors from 'cors';
import corsOptions from '@/config/cors';

import cookieParser from 'cookie-parser';
import router from './router';
import globalErrorHandler from './middleware/errorHandler';
import { limiter } from './middleware/limiter';
import config from '@/config/index';

const app: express.Application = express();

app.set('trust proxy', config.env === 'production');
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(router);
app.use(globalErrorHandler);

export default app;
