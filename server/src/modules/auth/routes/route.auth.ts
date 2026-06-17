import express from 'express';
import AuthController from '@/modules/auth/controller/auth.controller';
import {
    actionLimiter,
    authLimiter,
    forgotPasswordLimiter,
    lowLimiter,
    profileGetterLimiter,
    refreshTokenLimiter,
} from '@/middleware/limiter';
import validate from '@/middleware/validate';
import {
    accountActionsSchema,
    SecuritySettingsSchema,
    signInSchema,
    signUpSchema,
    UpdateSecuritySettingsSchema,
    validateEmailSchema,
} from '@/modules/auth/validation/validation.auth';
import protect from '@/middleware/protect';
import validateDomain from '../middleware/validateDomain';
import UserController from '../controller/user.controller';

const authRouter: express.Router = express.Router();
const controller = new AuthController();
const userController = new UserController();

authRouter.post(
    '/sign-in',
    authLimiter,
    validate(signInSchema),
    controller.signInController
);

authRouter.post('/sign-in/2fa/:otp', authLimiter, controller.verify2FA);

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
    validate(validateEmailSchema),
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

authRouter.post(
    '/account/action',
    actionLimiter,
    protect,
    validate(accountActionsSchema),
    userController.accountActions
);

authRouter.post(
    '/account/personal',
    actionLimiter,
    protect,
    validate(SecuritySettingsSchema),
    userController.PersonalInfo
);

authRouter.get(
    '/account/personal',
    profileGetterLimiter,
    protect,
    userController.getPersonalInfo
);

authRouter.put(
    '/account/personal',
    actionLimiter,
    protect,
    validate(UpdateSecuritySettingsSchema),
    userController.PersonalInfo
);

export default authRouter;
