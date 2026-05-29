import express from 'express';
import {
    getProfileController,
    refreshTokenController,
    signInController,
    signOutController,
    signUpController,
} from '@/modules/auth/controller/controller.auth';
import { authLimiter } from '@/middleware/limiter';
import validate from '@/middleware/validate';
import {
    signInSchema,
    signUpSchema,
} from '@/modules/auth/validation/validation.auth';
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
authRouter.post('/sign-out', authLimiter, signOutController);

authRouter.get('/me', protect, getProfileController);
authRouter.post('/refresh-token', protect, refreshTokenController);

export default authRouter;
