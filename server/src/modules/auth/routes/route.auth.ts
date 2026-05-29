import express from 'express';
import AuthController from '@/modules/auth/controller/controller.auth';
import {
    authLimiter,
    forgotPasswordLimiter,
    profileGetterLimiter,
    refreshTokenLimiter,
} from '@/middleware/limiter';
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

authRouter.get(
    '/me',
    profileGetterLimiter,
    protect,
    controller.getProfileController
);

authRouter.post(
    '/refresh-token',
    refreshTokenLimiter,
    protect,
    controller.refreshTokenController
);

authRouter.post(
    '/send-verification',
    authLimiter,
    protect,
    controller.sendVerificationController
);

authRouter.post(
    '/verify-email',
    authLimiter,
    protect,
    controller.verifyEmailController
);

authRouter.post(
    '/change-password',
    authLimiter,
    protect,
    controller.changePasswordController
);

authRouter.post(
    '/forgot-password',
    protect,
    forgotPasswordLimiter,
    controller.forgotPasswordController
);

authRouter.post(
    '/reset-password/:token',
    forgotPasswordLimiter,
    controller.resetPasswordController
);

export default authRouter;
