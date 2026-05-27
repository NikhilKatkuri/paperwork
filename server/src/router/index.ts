import express from 'express';
import authRouter from '@/modules/auth/route';

const router: express.Router = express.Router();

const baseName = '/api/v1';
const getFullPath = (path: string) => `${baseName}${path}`;

router.use(getFullPath('/auth'), authRouter);
export default router;
