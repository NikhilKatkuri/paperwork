import express from 'express';
import FormsController from '@/modules/forms/controllers/controller.forms';
import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import sectionRouter from '@/modules/forms/routes/route.sections';
import questionsRouter from './route.questions';
import fillRouter from './route.fill';
import {
    createFormsInnerLimiter,
    createFormsLimiter,
    limiter,
    lowLimiter,
} from '@/middleware/limiter';
import { formSchema, getFormSchema, patchRequestFormSchema, putRequestFormSchema, bulkPutFormSchema } from '../validators/validator.form';

const formsRouter = express.Router({ mergeParams: true });

const controller = new FormsController();

formsRouter.get('/', limiter, protect, controller.getAll);
formsRouter.post(
    '/',
    createFormsLimiter,
    protect,
    validate(formSchema),
    controller.create
);

formsRouter.put(
    '/:formId',
    limiter,
    protect,
    validate(putRequestFormSchema),
    controller.put
);

formsRouter.put('/:formId/bulk', limiter, protect, validate(bulkPutFormSchema), controller.bulkPut);

formsRouter.patch(
    '/:formId',
    createFormsInnerLimiter,
    protect,
    validate(patchRequestFormSchema),
    controller.patch
);

formsRouter.get(
    '/:formId',
    limiter,
    protect,
    validate(getFormSchema),
    controller.get
);

formsRouter.delete(
    '/:formId',
    createFormsLimiter,
    protect,
    validate(getFormSchema),
    controller.delete
);

formsRouter.post(
    '/:formId/publish',
    lowLimiter,
    protect,
    validate(getFormSchema),
    controller.publish
);
formsRouter.post(
    '/:formId/unpublish',
    lowLimiter,
    protect,
    validate(getFormSchema),
    controller.unPublish
);
formsRouter.post(
    '/:formId/duplicate',
    lowLimiter,
    protect,
    validate(getFormSchema),
    controller.duplicate
);

formsRouter.use(
    '/:formId/sections',
    createFormsInnerLimiter,
    protect,
    sectionRouter
);

formsRouter.use(
    '/:formId/sections/:sectionId/questions',
    createFormsInnerLimiter,
    protect,
    questionsRouter
);

formsRouter.use('/:formId/fill', lowLimiter, protect, fillRouter);
export default formsRouter;
