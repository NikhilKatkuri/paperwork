import express from 'express';
import FormsController from './forms.controller';
import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import { formSchema, getFormSchema } from './validation/form';

const formsRouter = express.Router();

const controller = new FormsController();
formsRouter.post('/', protect, validate(formSchema), controller.create);
formsRouter.get('/:id', protect, validate(getFormSchema), controller.get);
formsRouter.delete('/:id', protect, validate(getFormSchema), controller.delete);
formsRouter.put('/:id', protect, validate(formSchema), controller.update);

formsRouter.post(
    '/:id/publish',
    protect,
    validate(getFormSchema),
    controller.publish
);
formsRouter.post(
    '/:id/unpublish',
    protect,
    validate(getFormSchema),
    controller.unPublish
);
formsRouter.post(
    '/:id/duplicate',
    protect,
    validate(getFormSchema),
    controller.duplicate
);
formsRouter.get('/', protect, controller.getAll);
formsRouter.get('/public/:id', validate(getFormSchema), controller.publicGet);

export default formsRouter;
