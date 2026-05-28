import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import { StatusCodes } from 'http-status-codes';
import questionService from './questions.service';
import { AppError } from '@/utils/AppError';

class questionsController {
    service = new questionService();
    constructor() {
        const methods = Object.getOwnPropertyNames(
            questionsController.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    private getContent(req: Request) {
        const { id: userId } = req.user!;
        if (!userId) throw AppError.Unauthorized('User identity required');
        const { formId, sectionId, questionId } = req.params as {
            formId: string;
            sectionId: string;
            questionId: string;
        };

        return {
            userId,
            formId,
            sectionId,
            questionId,
            data: req.body?.data,
        };
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { questionId, ...data } = this.getContent(req);

            const result = await this.service.create({
                ...data,
            });

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Question created successfully',
                data: {
                    question: result,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { data: _, ...rest } = this.getContent(req);
            await this.service.delete(rest);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { data, ...rest } = this.getContent(req);
            const updatedQuestion = await this.service.update(rest, data);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Question updated successfully',
                data: {
                    question: updatedQuestion,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { data: _, ...rest } = this.getContent(req);
            const questions = await this.service.get(rest);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Questions retrieved successfully',
                data: {
                    questions,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { data: _, ...rest } = this.getContent(req);
            const question = await this.service.getById(rest);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Question retrieved successfully',
                data: {
                    question,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async reorder(req: Request, res: Response, next: NextFunction) {
        try {
            const { data: order, ...rest } = this.getContent(req);

            const result = await this.service.reorder(rest, order);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Questions reordered successfully',
                data: {
                    questions: result,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default questionsController;
