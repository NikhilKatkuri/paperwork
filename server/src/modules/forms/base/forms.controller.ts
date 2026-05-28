import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import FormsService from './forms.service';
import { StatusCodes } from 'http-status-codes';

class FormsController {
    service = new FormsService();
    constructor() {
        this.create = this.create.bind(this);
        this.get = this.get.bind(this);
        this.delete = this.delete.bind(this);
        this.update = this.update.bind(this);
        this.publish = this.publish.bind(this);
        this.unPublish = this.unPublish.bind(this);
        this.duplicate = this.duplicate.bind(this);
        this.getAll = this.getAll.bind(this);
    }
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.user!;
            const {
                title,
                description,
                isPrivate,
                allowedDomains,
                isPublished,
            } = req.body.data;

            const newForm = await this.service.create({
                userId,
                title,
                description,
                isPrivate,
                isPublished,
                allowedDomains,
            });

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Form created successfully',
                data: { form: newForm },
            });
        } catch (error) {
            next(error);
        }
    }

    readIds(req: Request) {
        const { id: userId } = req.user!;
        const { id: formId } = req.params as { id: string };
        return { userId, formId };
    }

    async get(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const form = await this.service.get(formId, userId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Form retrieved successfully',
            data: { form },
        });
    }

    async delete(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        await this.service.delete(formId, userId);
        res.status(StatusCodes.NO_CONTENT).send();
    }

    async update(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const { title, description, isPrivate, allowedDomains, isPublished } =
            req.body.data;

        const updatedForm = await this.service.update(
            {
                userId,
                title,
                description,
                isPrivate,
                allowedDomains,
                isPublished,
            },
            formId
        );

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Form updated successfully',
            data: { form: updatedForm },
        });
    }

    async publish(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const publishedForm = await this.service.publish(userId, formId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Form published successfully',
            data: { form: publishedForm },
        });
    }

    async unPublish(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const unpublishedForm = await this.service.unPublish(userId, formId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Form unpublished successfully',
            data: { form: unpublishedForm },
        });
    }

    async duplicate(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const duplicatedForm = await this.service.duplicate(userId, formId);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Form duplicated successfully',
            data: { form: duplicatedForm },
        });
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.user!;
            const forms = await this.service.getAll(userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Forms retrieved successfully',
                data: { forms },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FormsController;
