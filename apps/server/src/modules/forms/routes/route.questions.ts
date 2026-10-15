import protect from '@/middleware/protect';
import validate from '@/middleware/validate';
import express from 'express';
import {
    bulkCreateQuestionSchema,
    createQuestionSchema,
    getAllQuestionsSchema,
    getQuestionSchema,
    reorderQuestionSchema,
    updateQuestionSchema,
} from '@/modules/forms/validators/validator.question';
import questionsController from '@/modules/forms/controllers/controller.questions';

const questionsRouter = express.Router({ mergeParams: true });
const controller = new questionsController();
questionsRouter.post(
    '/',
    protect,
    validate(createQuestionSchema),
    controller.create
);
questionsRouter.post(
    '/bulk',
    protect,
    validate(bulkCreateQuestionSchema),
    controller.bulkCreate
);
questionsRouter.get(
    '/',
    protect,
    validate(getAllQuestionsSchema),
    controller.get
);
questionsRouter.put(
    '/reorder',
    protect,
    validate(reorderQuestionSchema),
    controller.reorder
);
questionsRouter.put(
    '/:questionId',
    protect,
    validate(updateQuestionSchema),
    controller.update
);
questionsRouter.delete(
    '/:questionId',
    protect,
    validate(getQuestionSchema),
    controller.delete
);

questionsRouter.get(
    '/:questionId',
    protect,
    validate(getQuestionSchema),
    controller.getById
);

export default questionsRouter;
