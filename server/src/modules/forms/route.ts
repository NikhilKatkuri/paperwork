import express from 'express';
import FormsController from './forms.controller';
import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import { formSchema, getFormSchema } from './validation/form';

const formsRouter = express.Router();

const controller = new FormsController();
formsRouter.post('/', protect, validate(formSchema), controller.create);
formsRouter.get('/:id', protect, validate(getFormSchema), controller.get);
formsRouter.delete('/:id', controller.delete);
formsRouter.put('/:id', controller.update);

formsRouter.post('/:id/publish', controller.publish);
formsRouter.post('/:id/unpublish', controller.unPublish);
formsRouter.post('/:id/duplicate', controller.duplicate);
formsRouter.get('/', controller.getAll);

export default formsRouter;
