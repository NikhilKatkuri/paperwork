import express from 'express';
import AuthController from '@/modules/auth/controller/controller.auth';
import { authLimiter } from '@/middleware/limiter';
import validate from '@/middleware/validate';
import {
    signInSchema,
    signUpSchema,
} from '@/modules/auth/validation/validation.auth';
import protect from '@/middleware/protect';

const authRouter: express.Router = express.Router();
const controller = new AuthController();
authRouter.post(
    '/sign-in',
    authLimiter,
    validate(signInSchema),
    controller.signInController
);
authRouter.post(
    '/sign-up',
    authLimiter,
    validate(signUpSchema),
    controller.signUpController
);
authRouter.post('/sign-out', authLimiter, controller.signOutController);

authRouter.get('/me', protect, controller.getProfileController);
authRouter.post('/refresh-token', protect, controller.refreshTokenController);
authRouter.post(
    '/send-verification',
    protect,
    controller.sendVerificationController
);
authRouter.post('/verify-email', protect, controller.verifyEmailController);
export default authRouter;
