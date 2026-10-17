import express from 'express';
import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import TemplatesController from '../controllers/controller.templates';
import { createTemplateSchema } from '../validators/validator.templates';

const formsTemplateRouter = express.Router({ mergeParams: true });
const controller = new TemplatesController();

// retrive all forms
formsTemplateRouter.get('/all', protect, controller.all);

// retrive specifi template
formsTemplateRouter.get('/:templateId', protect, controller.getByTemplateId);

// duplicate for user specific
formsTemplateRouter.post(
    '/:templateId/clone',
    protect,
    controller.cloneByTemplateId
);

// seed template
formsTemplateRouter.post(
    '/',
    protect,
    validate(createTemplateSchema),
    controller.seed
);

export default formsTemplateRouter;
