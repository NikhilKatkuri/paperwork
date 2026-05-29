import express from 'express';
import FormsController from './forms.controller';
import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import {
    formSchema,
    getFormSchema,
    patchRequestFormSchema,
    putRequestFormSchema,
} from '../validator.form';
import sectionRouter from '../sections/route';
import questionsRouter from '../questions/route';

import fillRouter from '../fill/fill.router';

const formsRouter = express.Router({ mergeParams: true });

const controller = new FormsController();

formsRouter.get('/', protect, controller.getAll);
formsRouter.post('/', protect, validate(formSchema), controller.create);
formsRouter.put(
    '/:formId',
    protect,
    validate(putRequestFormSchema),
    controller.put
);

formsRouter.patch(
    '/:formId',
    protect,
    validate(patchRequestFormSchema),
    controller.patch
);

formsRouter.get('/:formId', protect, validate(getFormSchema), controller.get);
formsRouter.delete(
    '/:formId',
    protect,
    validate(getFormSchema),
    controller.delete
);

formsRouter.post(
    '/:formId/publish',
    protect,
    validate(getFormSchema),
    controller.publish
);
formsRouter.post(
    '/:formId/unpublish',
    protect,
    validate(getFormSchema),
    controller.unPublish
);
formsRouter.post(
    '/:formId/duplicate',
    protect,
    validate(getFormSchema),
    controller.duplicate
);

formsRouter.use('/:formId/sections', sectionRouter);
formsRouter.use('/:formId/sections/:sectionId/questions', questionsRouter);
formsRouter.use('/:formId/fill', protect, fillRouter);
export default formsRouter;
