import validate from '@/middleware/validate';
import express from 'express';
import {
    createSectionSchema,
    getFormSchema,
    getSectionSchema,
    orderSectionSchema,
} from '../validator.form';
import protect from '@/middleware/protect';
import SectionController from './sections.controller';

const sectionRouter = express.Router({ mergeParams: true });
const controller = new SectionController();

sectionRouter.post(
    '/',
    protect,
    validate(createSectionSchema),
    controller.create
);
sectionRouter.get('/', protect, validate(getFormSchema), controller.get);
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
