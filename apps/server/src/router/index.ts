import express from 'express';
import authRouter from '@/modules/auth/routes/route.auth';
import formsRouter from '@/modules/forms/routes/route.forms';
import signaturesRouter from '@/modules/signatures/routes';
import { httpLogger } from '@/utils/logger';
import { captureRequestMeta } from '@/utils/requestMeta';
import { HTTP_EVENTS } from '@/middleware/httpLogger';
import { healthCheckLimiter } from '@/middleware/limiter';

const router: express.Router = express.Router();

const baseName = '/api/v1';
const getFullPath = (path: string) => `${baseName}${path}`;

router.use(getFullPath('/auth'), authRouter);
router.use(getFullPath('/forms'), formsRouter);
router.use(getFullPath('/'), signaturesRouter);
router.get('/health', healthCheckLimiter, (req, res) => {
    httpLogger.info('http.request_received', {
        event: HTTP_EVENTS.REQUEST_RECEIVED,
        ...captureRequestMeta(req, { includeBody: false }),
    });
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'ok' });
});

router.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});
export default router;
