import express from 'express';
import FillController from '@/modules/forms/controllers/controller.fill';
import validate from '@/middleware/validate';
import {
    exportResponsesSchema,
    fillFormSchema,
    postFormSchema,
    responseIdSchema,
    responsesQuerySchema,
    submissionStatusSchema,
} from '../validators/validator.fill';
import protect from '@/middleware/protect';
import { lowLimiter, submissionStatusLimiter } from '@/middleware/limiter';

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

/**
 * Declared before `/responses/:responseId` so the literal path is not captured
 * as an id (and then rejected as a malformed ObjectId).
 */
fillRouter.get(
    '/responses/summary',
    lowLimiter,
    protect,
    validate(responsesQuerySchema),
    fillController.responsesSummary
);
fillRouter.get(
    '/responses',
    lowLimiter,
    protect,
    validate(responsesQuerySchema),
    fillController.responses
);
fillRouter.get(
    '/responses/export/:exportType',
    lowLimiter,
    protect,
    validate(exportResponsesSchema),
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
    submissionStatusLimiter,
    protect,
    validate(submissionStatusSchema),
    fillController.getSubmissionStatus
);

export default fillRouter;
