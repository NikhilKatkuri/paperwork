import express from 'express';
import FillController from '@/modules/core/controllers/controller.fill';
import {
    fillFormSchema,
    postFormSchema,
} from '@/modules/core/validators/validator.question';
import validate from '@/middleware/validate';

const fillRouter = express.Router({ mergeParams: true });
const fillController = new FillController();

fillRouter.get('/', validate(fillFormSchema), fillController.fill);
fillRouter.post('/', validate(postFormSchema), fillController.submit);

export default fillRouter;
