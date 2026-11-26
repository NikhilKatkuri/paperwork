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
import {
    binFormsSchema,
    bulkPutFormSchema,
    createRequestFormSchema,
    getFormSchema,
    resolveShareSchema,
    patchRequestFormSchema,
    putRequestFormSchema,
    searchFormsSchema,
} from '../validators/validator.form';
import formsTemplateRouter from './route.template';

const formsRouter = express.Router({ mergeParams: true });

const controller = new FormsController();

formsRouter.use('/templates', formsTemplateRouter);

formsRouter.get('/', limiter, protect, controller.getAll);
formsRouter.post(
    '/',
    createFormsLimiter,
    protect,
    validate(createRequestFormSchema),
    controller.create
);

formsRouter.get(
    '/search',
    limiter,
    protect,
    validate(searchFormsSchema),
    controller.search
);

formsRouter.get(
    '/share/:code',
    lowLimiter,
    validate(resolveShareSchema),
    controller.resolveShareLink
);

// Bin routes must precede `/:formId`: otherwise "bin" is parsed as an id and
// fails ObjectId validation before the handler ever runs.
formsRouter.get(
    '/bin',
    limiter,
    protect,
    validate(binFormsSchema),
    controller.bin
);
formsRouter.delete('/bin', createFormsLimiter, protect, controller.emptyBin);

formsRouter.put(
    '/:formId',
    limiter,
    protect,
    validate(putRequestFormSchema),
    controller.put
);

formsRouter.put(
    '/:formId/bulk',
    limiter,
    protect,
    validate(bulkPutFormSchema),
    controller.bulkPut
);

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

// Default delete = move to bin. Permanent removal is an explicit, separate
// route used by the bin screen once the user has confirmed the loss.
formsRouter.delete(
    '/:formId',
    createFormsLimiter,
    protect,
    validate(getFormSchema),
    controller.delete
);
formsRouter.delete(
    '/:formId/permanent',
    createFormsLimiter,
    protect,
    validate(getFormSchema),
    controller.deletePermanent
);
formsRouter.post(
    '/:formId/restore',
    lowLimiter,
    protect,
    validate(getFormSchema),
    controller.restore
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

formsRouter.post(
    '/:formId/share',
    lowLimiter,
    protect,
    validate(getFormSchema),
    controller.createShareLink
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
