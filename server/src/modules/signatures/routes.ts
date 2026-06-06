import express from 'express';
import CloudinaryController from './cloudinary/controllers/cloudinary.controller';
import { lowLimiter } from '@/middleware/limiter';

const signaturesRouter = express.Router();

signaturesRouter.get(
    '/cloudinary/signature',
    lowLimiter,
    CloudinaryController.getSignature
);

export default signaturesRouter;
