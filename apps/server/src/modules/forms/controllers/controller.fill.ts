import { Response, NextFunction, Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createHash } from 'node:crypto';
import { once } from 'node:events';

import { stringify } from 'csv-stringify';

import FillService from '@/modules/forms/service/service.fill';
import { AppError } from '@/utils/AppError';
import { cacheRedis, trendEngine } from '@/redis';
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

        const { formId, responseId, exportType, submissionId } = req.params as {
            formId: string;
            responseId: string;
            exportType: string;
            submissionId: string;
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
        const userAgent =
            body.metadata?.userAgent ?? req.headers['user-agent'] ?? 'Unknown';
        const ipAddress =
            body.metadata?.ipAddress ??
            ((req.ip || req.socket.remoteAddress || 'Unknown') as string);
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
            submissionId,
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
                    } catch {
                        /* ignore */
                    }
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
                // Keyed by user as well: domain-restricted (private) forms
                // must not let a second user reuse the first user's verified
                // read, which would bypass their own domain check.
                const readKey = `${formId}:${userId}`;
                let dbPromise = this.inFlightReads.get(readKey);
                const isFirst = !dbPromise;

                if (isFirst) {
                    dbPromise = this.service
                        .get(formId, userId, email)
                        .finally(() => {
                            this.inFlightReads.delete(readKey);
                        });
                    this.inFlightReads.set(readKey, dbPromise);
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

            /**
             * The submission id is derived from the idempotency key, so a
             * double-click produces the same id, the same status record and
             * the same BullMQ job (deduplicated by jobId) instead of two
             * independent submissions racing to create two responses.
             */
            const submissionId = createHash('sha1')
                .update(`submission:${params.formId}:${params.idempotencyKey}`)
                .digest('hex')
                .slice(0, 24);

            // Store the respondent's own email when provided; the
            // authenticated email is only the fallback.
            const email = params.responseEmail ?? params.email;

            /**
             * A repeated key whose submission is already in flight or done
             * must not be re-queued (the client is polling the same id), and
             * a failed one is retried by replacing its status. Check the
             * status record before touching the queue.
             */
            const statusKey = submissionKey(submissionId);
            let existingStatus: string | undefined;
            try {
                const raw = await cacheRedis.get(statusKey);
                if (raw) {
                    existingStatus = JSON.parse(raw)?.status;
                }
            } catch {
                /* cache unavailable: fall through and queue */
            }

            const alreadySettled =
                existingStatus === 'done' ||
                existingStatus === 'pending' ||
                existingStatus === 'processing';

            if (!alreadySettled) {
                await Promise.all([
                    cacheRedis.set(
                        statusKey,
                        JSON.stringify({
                            submissionId,
                            status: 'pending',
                            formId: params.formId,
                            createdAt: Date.now(),
                        }),
                        'EX',
                        3600 // 1hr
                    ),
                    // No custom jobId: a retained failed job with the same
                    // id would silently absorb the retry. Duplicate queue
                    // entries are harmless — `post` collapses them via the
                    // idempotency key.
                    submissionQueue.add('submit', {
                        ...params,
                        submissionId,
                        email,
                    }),
                ]);
            }

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

            const summary = await this.service.responsesSummary(
                formId,
                {
                    search: query.q,
                    questionId: query.questionId,
                },
                userId
            );

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
            const response = await this.service.getResponse(
                formId,
                responseId,
                userId
            );
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
        try {
            const { formId, exportType, userId } = this.getContent(req);
            const query = (req.query ?? {}) as {
                q?: string;
                questionId?: string;
                sort?: 'newest' | 'oldest';
            };

            const { cursor, questionIdToColumn, columns } =
                await this.service.exportResponses(formId, exportType, userId, {
                    search: query.q,
                    questionId: query.questionId,
                    sort: query.sort,
                });

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="responses-${formId}.csv"`
            );
            res.setHeader('Cache-Control', 'no-store');

            // BOM so Excel opens UTF-8 content (e.g. Hindi answers) correctly.
            const stringifier = stringify({ header: true, columns, bom: true });
            stringifier.on('error', (streamError) => {
                res.destroy(streamError as Error);
            });
            stringifier.pipe(res);

            for await (const response of cursor) {
                const row: Record<string, string> = {
                    email: response.email ?? '',
                    submittedAt: response.createdAt
                        ? new Date(response.createdAt).toISOString()
                        : '',
                };

                for (const answer of response.answers ?? []) {
                    const column = questionIdToColumn.get(
                        String(answer.questionId)
                    );
                    if (!column) continue;

                    const value = answer.value;
                    row[column] = Array.isArray(value)
                        ? value.map(String).join('; ')
                        : String(value ?? '');
                }

                if (!stringifier.write(row)) {
                    // Respect backpressure: the DB cursor waits while the
                    // client's socket is congested instead of buffering the
                    // whole export in memory.
                    await once(stringifier, 'drain');
                }
            }

            stringifier.end();
        } catch (error) {
            // Once headers are out, the only correct failure mode is
            // destroying the socket: a JSON error would corrupt the CSV.
            if (res.headersSent) {
                res.destroy(error as Error);
                return;
            }
            next(error);
        }
    }

    async getSubmissionStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { submissionId, userId } = this.getContent(req);
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

            let status: any;
            try {
                status = JSON.parse(raw);
            } catch {
                logError(
                    cacheLogger,
                    'submission_status_corrupted',
                    new Error('Status payload is not valid JSON'),
                    { event: 'CACHE_READ_FAILED', submissionId }
                );
                throw AppError.Internal('Submission status corrupted');
            }

            /**
             * Status keys are derived from the idempotency key, which the
             * client generates and could guess. Verify the caller owns the
             * form the submission belongs to before echoing anything back.
             */
            if (!status?.formId || typeof status.formId !== 'string') {
                throw AppError.NotFound('Submission not found or expired');
            }
            await this.service.assertOwner(status.formId, userId);

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
