import express from 'express';
import authRouter from '@/modules/auth/routes/route.auth';
import formsRouter from '@/modules/forms/routes/route.forms';
import signaturesRouter from '@/modules/signatures/routes';

const router: express.Router = express.Router();

const baseName = '/api/v1';
const getFullPath = (path: string) => `${baseName}${path}`;

router.use(getFullPath('/auth'), authRouter);
router.use(getFullPath('/forms'), formsRouter);
// `signaturesRouter` protects its own routes; mounting with `protect` here
// would turn every unmatched path into a misleading 401 instead of a 404.
router.use(getFullPath('/'), signaturesRouter);

router.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});
export default router;
