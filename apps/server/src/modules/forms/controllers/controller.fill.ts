import { Response, NextFunction, Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import FillService from '@/modules/forms/service/service.fill';
import { AppError } from '@/utils/AppError';
import { cacheRedis, trendEngine } from '@/redis';
import mongoose from 'mongoose';
import { submissionQueue } from '@/queues';
import { submissionKey } from '@/workers/SubmissionWorker';
import { cacheLogger, logError } from '@/utils/logger';

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

    private readonly inFlightReads = new Map<string, Promise<any>>();

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

        // Accept both the validated flat body and the legacy {data} wrapper.
        const body = (req.body ?? {}) as any;
        const rawAnswers = Array.isArray(body.answers)
            ? body.answers
            : Array.isArray(body.data)
              ? body.data
              : undefined;
        const answers = rawAnswers?.map((a: any) => ({
            questionId: String(a.questionId ?? a.id ?? ''),
            questionSlug: a.questionSlug ?? a.slug,
            value: Array.isArray(a.value)
                ? a.value.map(String)
                : a.value !== undefined
                  ? [String(a.value)]
                  : [],
        }));
        const userAgent = body.metadata?.userAgent
            ?? req.headers['user-agent'] ?? 'Unknown';
        const ipAddress = body.metadata?.ipAddress
            ?? (req.ip || req.socket.remoteAddress || 'Unknown') as string;
        const pageRaw = (req.query as any)?.page;
        const limitRaw = (req.query as any)?.limit;
        const page = Number.parseInt(String(pageRaw ?? '1'), 10);
        const limit = Number.parseInt(String(limitRaw ?? '20'), 10);
        return {
            userId,
            email,
            formId,
            answers,
            idempotencyKey: body.idempotencyKey,
            isCompleted: body.isCompleted,
            currentSectionId: body.currentSectionId,
            responseEmail: body.email,
            metadata: {
                userAgent: String(userAgent).slice(0, 500),
                ipAddress: String(ipAddress).slice(0, 100),
            },
            page: Number.isFinite(page) ? page : 1,
            limit: Number.isFinite(limit) ? limit : 20,
            responseId,
            exportType,
        };
    }

    async fill(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, email, formId } = this.getContent(req);

            let formData: string | null = null;
            try {
                formData = await trendEngine.getForm(formId);
            } catch {
                formData = null;
            }

            // A cache hit is only a fast path: re-verify availability so
            // unpublished/private/closed forms are never served stale.
            if (formData) {
                try {
                    const parsed = JSON.parse(formData) as any;
                    const formDoc = parsed?.form ?? parsed;
                    await this.service.verifier(formDoc, userId, email);
                } catch (verifyError) {
                    // Stale or now-inaccessible: drop cache and fall through
                    // to the DB path which throws the correct status.
                    try {
                        trendEngine.invalidate?.(formId);
                    } catch { /* ignore */ }
                    formData = null;
                    if (
                        verifyError instanceof AppError ||
                        (verifyError as any)?.statusCode
                    ) {
                        throw verifyError;
                    }
                }
            }

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
                        .catch((err: unknown) => {
                            // The response is already on its way; a cache
                            // write failure degrades search, not the request.
                            logError(
                                cacheLogger,
                                'form_data_cache_failed',
                                err,
                                {
                                    event: 'CACHE_WRITE_FAILED',
                                    formId,
                                }
                            );
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
            const { formId, userId } = this.getContent(req);
            const query = (req.query ?? {}) as {
                page?: number;
                limit?: number;
                q?: string;
                questionId?: string;
                sort?: 'newest' | 'oldest';
            };

            const { responses, pagination } = await this.service.responses(
                formId,
                query.page ?? 1,
                query.limit ?? 20,
                {
                    search: query.q,
                    questionId: query.questionId,
                    sort: query.sort,
                },
                userId
            );

            if (!responses) {
                throw AppError.BadRequest('Form not found or no responses');
            }

            /**
             * `pagination` is returned alongside `data` in both cases. It used
             * to be omitted for an empty page, which left the client unable to
             * show totals or page count for a form with no responses yet.
             */
            res.status(StatusCodes.OK).json({
                success: true,
                message: responses.length
                    ? 'Responses retrieved successfully'
                    : 'No responses found for this form',
                data: responses,
                pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async responsesSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, userId } = this.getContent(req);
            const query = (req.query ?? {}) as {
                q?: string;
                questionId?: string;
            };

            const summary = await this.service.responsesSummary(formId, {
                search: query.q,
                questionId: query.questionId,
            }, userId);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Response summary retrieved successfully',
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }

    async getResponse(req: Request, res: Response, next: NextFunction) {
        try {
            const { formId, responseId, userId } = this.getContent(req);
            const response = await this.service.getResponse(formId, responseId, userId);
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
        const { formId, exportType, userId } = this.getContent(req);
        try {
            const text = await this.service.exportResponses(formId, exportType, userId);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="responses-${formId}.csv"`
            );
            res.status(StatusCodes.OK).send(text);
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
            let raw: string | null = null;
            try {
                raw = await cacheRedis.get(submissionKey(submissionId));
            } catch {
                throw AppError.Internal('Submission status unavailable');
            }

            if (!raw) {
                throw AppError.NotFound('Submission not found or expired');
            }

            let status: unknown;
            try {
                status = JSON.parse(raw);
            } catch {
                throw AppError.Internal('Submission status corrupted');
            }

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
