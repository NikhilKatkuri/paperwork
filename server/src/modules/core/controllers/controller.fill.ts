import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CustomAuthRequest as Request } from '@/types';
import FillService from '@/modules/core/service/service.fill';
import { AppError } from '@/utils/AppError';

class FillController {
    service = new FillService();
    constructor() {
        const methods = Object.getOwnPropertyNames(
            FillController.prototype
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
        const { id: userId, email } = req.user!;
        if (!userId) {
            throw AppError.Unauthorized('User not authenticated');
        }

        const { formId, responseId, exportType } = req.params as {
            formId: string;
            responseId: string;
            exportType: string;
        };
        if (!formId) {
            throw AppError.BadRequest('Form ID is required');
        }

        const answers = req.body?.data ?? undefined;
        const userAgent = req.headers['user-agent'] ?? 'Unknown';
        const ipAddress = (req.ip ||
            req.socket.remoteAddress ||
            'Unknown') as string;
        const { page, limit } = req.query as { page?: string; limit?: string };
        return {
            userId,
            email,
            formId,
            answers,
            metadata: {
                userAgent,
                ipAddress,
            },
            page,
            limit,
            responseId,
            exportType,
        };
    }

    async fill(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, formId } = this.getContent(req);

            const formData = await this.service.get(formId, userId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: formData,
            });
        } catch (error) {
            next(error);
        }
    }
    async submit(req: Request, res: Response, next: NextFunction) {
        try {
            const { ...params } = this.getContent(req);
            await this.service.post(params);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form submitted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async responses(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, page, limit } = this.getContent(req);
            const { responses, pagination } = await this.service.responses(
                formId,
                parseInt(page ?? '1'),
                parseInt(limit ?? '20')
            );

            if (!responses) {
                throw AppError.BadRequest('Form not found or no responses');
            }
            if (responses.length === 0) {
                res.status(StatusCodes.OK).json({
                    success: true,
                    message: 'No responses found for this form',
                    data: [],
                });
                return;
            }

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Responses retrieved successfully',
                data: responses,
                pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getResponse(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, responseId } = this.getContent(req);
            const response = await this.service.getResponse(formId, responseId);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Response retrieved successfully',
                data: response,
            });
        } catch (error) {
            next(error);
        }
    }

    async exportResponses(req: Request, res: Response, next: NextFunction) {
        const { formId, exportType } = this.getContent(req);
        try {
            const text = await this.service.exportResponses(formId, exportType);
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Responses exported successfully',
                data: text,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FillController;
