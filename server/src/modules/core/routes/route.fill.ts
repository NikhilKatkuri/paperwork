import express from 'express';
import FillController from '@/modules/core/controllers/controller.fill';
import {
    fillFormSchema,
    postFormSchema,
} from '@/modules/core/validators/validator.question';
import validate from '@/middleware/validate';
import { responseIdSchema } from '../validators/validator.fill';
import protect from '@/middleware/protect';
import { limiter } from '@/middleware/limiter';
const fillRouter = express.Router({ mergeParams: true });
const fillController = new FillController();

fillRouter.get('/', limiter, protect, validate(fillFormSchema), fillController.fill);
fillRouter.post('/', limiter, protect, validate(postFormSchema), fillController.submit);

fillRouter.get('/responses', limiter, protect, fillController.responses);
fillRouter.get(
    '/responses/export/:exportType',
    limiter,
    protect,
    fillController.exportResponses
);
fillRouter.get(
    '/responses/:responseId',
    limiter,
    protect,
    validate(responseIdSchema),
    fillController.getResponse
);

export default fillRouter;
