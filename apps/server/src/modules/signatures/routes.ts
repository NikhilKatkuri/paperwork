import express from 'express';
import CloudinaryController from './cloudinary/controllers/cloudinary.controller';
import { lowLimiter } from '@/middleware/limiter';
import protect from '@/middleware/protect';

const signaturesRouter = express.Router();

signaturesRouter.get(
    '/cloudinary/signature',
    protect,
    lowLimiter,
    CloudinaryController.getSignature
);

export default signaturesRouter;
