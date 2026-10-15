import validate from '@/middleware/validate';
import express from 'express';
import {
    createSectionSchema,
    getSectionSchema,
    orderSectionSchema,
} from '@/modules/forms/validators/validator.sections';
import protect from '@/middleware/protect';
import SectionController from '@/modules/forms/controllers/controller.sections';
import { getFormSchema } from '@/modules/forms/validators/validator.form';

const sectionRouter = express.Router({ mergeParams: true });
const controller = new SectionController();

sectionRouter.get('/', protect, validate(getFormSchema), controller.get);

sectionRouter.post(
    '/',
    protect,
    validate(createSectionSchema),
    controller.create
);

sectionRouter.put(
    '/reorder',
    protect,
    validate(orderSectionSchema),
    controller.reorder
);

sectionRouter.put(
    '/:sectionId',
    protect,
    validate(createSectionSchema),
    controller.update
);

sectionRouter.delete(
    '/:sectionId',
    protect,
    validate(getSectionSchema),
    controller.delete
);

sectionRouter.get(
    '/:sectionId',
    protect,
    validate(getSectionSchema),
    controller.getById
);

export default sectionRouter;
