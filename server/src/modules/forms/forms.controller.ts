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
        res.json({ data: form });
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

        res.json({ data: updatedForm });
    }

    async publish(_req: Request, _res: Response) {}
    async unPublish(_req: Request, _res: Response) {}
    async duplicate(_req: Request, _res: Response) {}

    async getAll(_req: Request, _res: Response) {}
}

export default FormsController;
