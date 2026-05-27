import express from 'express';
import authRouter from '@/modules/auth/route';
import formsRouter from '@/modules/forms/route';

const router: express.Router = express.Router();

const baseName = '/api/v1';
const getFullPath = (path: string) => `${baseName}${path}`;

router.use(getFullPath('/auth'), authRouter);
router.use(getFullPath('/forms'), formsRouter);
export default router;
