import express from 'express';
import FillController from '@/modules/core/controllers/controller.fill';
import {
    fillFormSchema,
    postFormSchema,
} from '@/modules/core/validators/validator.question';
import validate from '@/middleware/validate';
import { responseIdSchema } from '../validators/validator.fill';

const fillRouter = express.Router({ mergeParams: true });
const fillController = new FillController();

fillRouter.get('/', validate(fillFormSchema), fillController.fill);
fillRouter.post('/', validate(postFormSchema), fillController.submit);

fillRouter.get('/responses', fillController.responses);
fillRouter.get('/responses/export/:exportType', fillController.exportResponses);
fillRouter.get(
    '/responses/:responseId',
    validate(responseIdSchema),
    fillController.getResponse
);

export default fillRouter;
