import express from 'express';

import helmet from 'helmet';

import cors from 'cors';
import corsOptions from '@/config/cors';
import config from '@/config';

import cookieParser from 'cookie-parser';
import router from './router';
import globalErrorHandler from './middleware/errorHandler';
import { limiter } from './middleware/limiter';

import requestId from '@/middleware/requestId';
import { requestCompleted, requestReceived } from '@/middleware/httpLogger';
import securityAudit from '@/middleware/securityAudit';

const app: express.Application = express();

// `trust proxy` comes from `TRUST_PROXY` (config). The default trusts exactly
// one hop — the load balancer in front of Node — so a client cannot spoof
// `req.ip` through `X-Forwarded-For` unless it can reach Node directly.
// Deployments with a different topology (no proxy, multiple hops, specific
// proxy subnets) configure the setting explicitly; see `resolveTrustProxy`.
app.set('trust proxy', config.trustProxy);

// Correlation id first, ahead of everything that can reject a request.
// Helmet, CORS and the rate limiters must not be able to emit an
// untraceable response.
app.use(requestId);

// Access log entry, emitted on arrival rather than on completion so a
// request that never finishes is still recorded.
app.use(requestReceived);

app.use(helmet());
app.use(cors(corsOptions));

// Registered ahead of the limiter and the body parsers so throttled and
// unparseable requests are logged too. Fires after `protect`, so the
// completed line can attribute the request to a user.
app.use(requestCompleted);

// Escalates repeated rejected requests from one client into a security event.
app.use(securityAudit);

app.use(limiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(router);
app.use(globalErrorHandler);

export default app;
