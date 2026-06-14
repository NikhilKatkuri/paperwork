import express from 'express';
import AuthController from '@/modules/auth/controller/controller.auth';
import {
    authLimiter,
    forgotPasswordLimiter,
    lowLimiter,
    profileGetterLimiter,
    refreshTokenLimiter,
} from '@/middleware/limiter';
import validate from '@/middleware/validate';
import {
    signInSchema,
    signUpSchema,
    validateEmailSchema,
} from '@/modules/auth/validation/validation.auth';
import protect from '@/middleware/protect';
import validateDomain from '../middleware/validateDomain';

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
    validateDomain,
    controller.signUpController
);

authRouter.post(
    '/sign-out',
    authLimiter,
    protect,
    controller.signOutController
);

authRouter.get(
    '/me',
    profileGetterLimiter,
    protect,
    controller.getProfileController
);

authRouter.post(
    '/refresh-token',
    refreshTokenLimiter,
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
    forgotPasswordLimiter,
    protect,
    controller.forgotPasswordController
);

authRouter.post(
    '/reset-password/:token',
    forgotPasswordLimiter,
    controller.resetPasswordController
);

authRouter.post(
    '/check-email',
    lowLimiter,
    validate(validateEmailSchema),
    controller.checkEmailController
);

export default authRouter;
