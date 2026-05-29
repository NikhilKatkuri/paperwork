import express from 'express';
import authRouter from '@/modules/auth/routes/route.auth';
import formsRouter from '@/modules/core/routes/route.forms';

const router: express.Router = express.Router();

const baseName = '/api/v1';
const getFullPath = (path: string) => `${baseName}${path}`;

router.use(getFullPath('/auth'), authRouter);
router.use(getFullPath('/forms'), formsRouter);

router.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});
export default router;
