import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import FormsService from './forms.service';
import { StatusCodes } from 'http-status-codes';

class FormsController {
    service = new FormsService();

    constructor() {
        const methods = Object.getOwnPropertyNames(
            FormsController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getRequestData(req: Request) {
        return {
            userId: req.user!.id,
            formId: req.params.formId as string,
            bodyData: req.body?.data,
        };
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, bodyData } = this.getRequestData(req);

            const newForm = await this.service.create({
                ...bodyData,
                userId,
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

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const form = await this.service.get(formId, userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: { form },
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            await this.service.delete(formId, userId);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    async put(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);

            const updatedForm = await this.service.put(
                req.body.data,
                userId,
                formId
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form updated successfully',
                data: { form: updatedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async patch(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId, bodyData } = this.getRequestData(req);

            const updatedForm = await this.service.patch(
                bodyData,
                userId,
                formId
            );

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form updated successfully',
                data: { form: updatedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async publish(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const publishedForm = await this.service.publish(userId, formId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form published successfully',
                data: { form: publishedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async unPublish(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const unpublishedForm = await this.service.unPublish(
                userId,
                formId
            );
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form unpublished successfully',
                data: { form: unpublishedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async duplicate(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getRequestData(req);
            const duplicatedForm = await this.service.duplicate(userId, formId);
            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Form duplicated successfully',
                data: { form: duplicatedForm },
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = this.getRequestData(req);
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
