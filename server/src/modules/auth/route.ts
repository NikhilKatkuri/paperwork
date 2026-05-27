import express from 'express';
import {
    getProfileController,
    refreshTokenController,
    signInController,
    signOutController,
    signUpController,
} from './auth.controller';
import { authLimiter } from '@/middleware/limiter';
import validate from '@/middleware/validate';
import { signInSchema, signUpSchema } from './auth.validation';
import protect from '@/middleware/protect';

const authRouter: express.Router = express.Router();

authRouter.post(
    '/sign-in',
    authLimiter,
    validate(signInSchema),
    signInController
);
authRouter.post(
    '/sign-up',
    authLimiter,
    validate(signUpSchema),
    signUpController
);
authRouter.post('/me', protect, authLimiter, getProfileController);
authRouter.post('/refresh-token', protect, authLimiter, refreshTokenController);

authRouter.post('/sign-out', authLimiter, signOutController);

export default authRouter;
