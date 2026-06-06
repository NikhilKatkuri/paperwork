import express from 'express';
import FillController from '@/modules/core/controllers/controller.fill';
import {
    fillFormSchema,
    postFormSchema,
} from '@/modules/core/validators/validator.question';
import validate from '@/middleware/validate';
import { responseIdSchema } from '../validators/validator.fill';
import protect from '@/middleware/protect';
import { lowLimiter } from '@/middleware/limiter';

const fillRouter = express.Router({ mergeParams: true });
const fillController = new FillController();

fillRouter.get(
    '/',
    lowLimiter,
    protect,
    validate(fillFormSchema),
    fillController.fill
);
fillRouter.post(
    '/',
    lowLimiter,
    protect,
    validate(postFormSchema),
    fillController.submit
);

fillRouter.get('/responses', lowLimiter, protect, fillController.responses);
fillRouter.get(
    '/responses/export/:exportType',
    lowLimiter,
    protect,
    fillController.exportResponses
);
fillRouter.get(
    '/responses/:responseId',
    lowLimiter,
    protect,
    validate(responseIdSchema),
    fillController.getResponse
);

fillRouter.get(
    '/submissions/:submissionId/status',
    lowLimiter,
    protect,
    fillController.getSubmissionStatus
);

export default fillRouter;
