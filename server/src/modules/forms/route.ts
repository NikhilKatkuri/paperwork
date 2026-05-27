import express from 'express';
import FormsController from './forms.controller';

const formsRouter = express.Router();

const controller = new FormsController();
formsRouter.post('/', controller.create);
formsRouter.get('/:id', controller.get);
formsRouter.delete('/:id', controller.delete);
formsRouter.put('/:id', controller.update);

formsRouter.post('/:id/publish', controller.publish);
formsRouter.post('/:id/unpublish', controller.unPublish);
formsRouter.post('/:id/duplicate', controller.duplicate);
formsRouter.get('/', controller.getAll);

export default formsRouter;
