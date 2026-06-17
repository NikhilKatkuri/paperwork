import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Request } from 'express';
import FillService from '@/modules/forms/service/service.fill';
import { AppError } from '@/utils/AppError';
import { cacheRedis, trendEngine } from '@/redis';
import mongoose from 'mongoose';
import { submissionQueue } from '@/queues';
import { submissionKey } from '@/workers/SubmissionWorker';

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

    private inFlightReads = new Map<string, Promise<any>>();

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

            let formData = await trendEngine.getForm(formId);

            if (!formData) {
                let dbPromise = this.inFlightReads.get(formId);
                const isFirst = !dbPromise;

                if (isFirst) {
                    dbPromise = this.service.get(formId, userId).finally(() => {
                        this.inFlightReads.delete(formId);
                    });
                    this.inFlightReads.set(formId, dbPromise);
                }

                const db = await dbPromise;
                if (!db) {
                    throw AppError.NotFound('Form not found');
                }

                formData = JSON.stringify(db, null, 2);

                if (isFirst) {
                    await trendEngine
                        .handleDbFallback(formId, formData)
                        .catch((err) => {
                            console.error('Error caching form data:', err);
                        });
                }
            }

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: JSON.parse(formData),
            });
        } catch (error) {
            next(error);
        }
    }

    async submit(req: Request, res: Response, next: NextFunction) {
        try {
            const { ...params } = this.getContent(req);
            const submissionId = new mongoose.Types.ObjectId().toString();
            await cacheRedis.set(
                submissionKey(submissionId),
                JSON.stringify({
                    submissionId,
                    status: 'pending',
                    formId: params.formId,
                    createdAt: Date.now(),
                }),
                'EX',
                3600 // 1hr
            );
            await submissionQueue.add('submit', {
                submissionId,
                ...params,
            });

            res.status(StatusCodes.ACCEPTED).json({
                success: true,
                message: 'Submission received',
                data: { submissionId }, // client uses this to poll
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

    async getSubmissionStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { submissionId } = req.params as { submissionId: string };
            if (!submissionId) {
                throw AppError.BadRequest('Submission ID is required');
            }
            const raw = await cacheRedis.get(submissionKey(submissionId));

            if (!raw) {
                throw AppError.NotFound('Submission not found or expired');
            }

            const status = JSON.parse(raw);

            res.status(StatusCodes.OK).json({
                success: true,
                data: status,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FillController;
