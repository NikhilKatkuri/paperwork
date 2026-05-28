import { NextFunction, Response } from 'express';
import { CustomAuthRequest as Request } from '@/types';
import { StatusCodes } from 'http-status-codes';
import questionService from './questions.service';

class questionsController {
    service = new questionService();
    constructor() {
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);
        this.update = this.update.bind(this);
        this.get = this.get.bind(this);
        this.getById = this.getById.bind(this);
        this.reorder = this.reorder.bind(this);
    }
    readIds(req: Request) {
        const { id: userId } = req.user!;
        const { id: formId } = req.params as { id: string };
        const { sectionId } = req.params as { sectionId: string };
        return { userId, formId, sectionId };
    }
    readAllIds(req: Request) {
        const { questionId } = req.params as {
            questionId: string;
        };
        return { ...this.readIds(req), questionId };
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId, sectionId } = this.readIds(req);
            const data = req.body.data;
            const result = await this.service.create({
                userId,
                formId,
                sectionId,
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
            const ids = this.readAllIds(req);
            await this.service.delete(ids);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ids = this.readAllIds(req);
            const data = req.body.data;
            const updatedQuestion = await this.service.update(ids, data);
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
            const ids = this.readIds(req);
            const questions = await this.service.get(ids);
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
            const ids = this.readAllIds(req);
            const question = await this.service.getById(ids);
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
            const { userId, formId, sectionId } = this.readIds(req);
            const order = req.body.data;

            const result = await this.service.reorder(
                { userId, formId, sectionId },
                order
            );

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
