import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import FormsService from './forms.service';
import { StatusCodes } from 'http-status-codes';

class FormsController {
    service = new FormsService();

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.user!;
            const {
                title,
                description,
                isPrivate,
                allowedDomains,
                isPublished,
            } = req.body;

            const newForm = await this.service.create({
                userId,
                title,
                description,
                isPrivate,
                isPublished,
                allowedDomains,
            });

            res.status(StatusCodes.CREATED).json({ data: newForm });
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
        res.status(StatusCodes.OK).json({ data: form });
    }

    async delete(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        await this.service.delete(formId, userId);
        res.status(StatusCodes.NO_CONTENT).send();
    }

    async update(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const { title, description, isPrivate, allowedDomains, isPublished } =
            req.body;

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

        res.status(StatusCodes.OK).json({ data: updatedForm });
    }

    async publish(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const publishedForm = await this.service.publish(userId, formId);
        res.status(StatusCodes.OK).json({ data: publishedForm });
    }

    async unPublish(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const unpublishedForm = await this.service.unPublish(userId, formId);
        res.status(StatusCodes.OK).json({ data: unpublishedForm });
    }

    async duplicate(req: Request, res: Response) {
        const { userId, formId } = this.readIds(req);
        const duplicatedForm = await this.service.duplicate(userId, formId);
        res.status(StatusCodes.CREATED).json({ data: duplicatedForm });
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = req.user!;
            const forms = await this.service.getAll(userId);
            res.status(StatusCodes.OK).json({ data: forms });
        } catch (error) {
            next(error);
        }
    }

    async publicGet(req: Request, res: Response, next: NextFunction) {
        const { id: formId } = req.params as { id: string };
        try {
            const form = await this.service.publicGet(formId);
            res.status(StatusCodes.OK).json({ data: form });
        } catch (error) {
            next(error);
        }
    }
}

export default FormsController;
