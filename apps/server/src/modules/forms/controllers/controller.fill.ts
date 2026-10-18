import { Response, NextFunction, Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import { once } from 'node:events';

import { stringify } from 'csv-stringify';

import FillService from '@/modules/forms/service/service.fill';
import { AppError } from '@/utils/AppError';
import { lookupGeo, parseUserAgent } from '@/utils/metadata';
import { captureNetworkInfo } from '@/utils/requestMeta';

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
        // Submission metadata is derived from the request itself. Client
        // bodies are never trusted for this: a caller can write any value it
        // likes into `body.metadata`, so accepting it would let a respondent
        // forge the address or device recorded against their own answer.
        const network = captureNetworkInfo(req);
        const userAgent = parseUserAgent(req.headers['user-agent']);
        const location = lookupGeo(network.ip ?? null);
        const deviceLabel = [userAgent.device?.brand, userAgent.device?.model]
            .filter(Boolean)
            .join(' ');
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
                userAgent: userAgent.raw ?? 'Unknown',
                ipAddress: network.ip?.slice(0, 100) ?? 'Unknown',
                browser: userAgent.browser?.family ?? undefined,
                os: userAgent.os?.family ?? undefined,
                device: deviceLabel || userAgent.device?.type || undefined,
                country: location?.country ?? undefined,
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

            // Keyed by user as well: domain-restricted (private) forms must
            // not let a second user reuse the first user's verified read,
            // which would bypass their own domain check.
            //
            // `service.get` performs the availability/domain/schedule checks
            // (throwing the correct AppError status) before returning the
            // form, so no separate verification pass is needed here.
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

            const form = await dbPromise;
            if (!form) {
                throw AppError.NotFound('Form not found');
            }

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Form retrieved successfully',
                data: form,
            });
        } catch (error) {
            next(error);
        }
    }

    async submit(req: Request, res: Response, next: NextFunction) {
        try {
            const { ...params } = this.getContent(req);

            // Store the respondent's own email when provided; the
            // authenticated email is only the fallback.
            const email = params.responseEmail ?? params.email;

            /**
             * Persisted synchronously — there is no queue or background
             * worker any more. The stored response is the submission record:
             * a repeated idempotency key resolves to the same row (and the
             * same id), and the confirmation email is written to the Mongo
             * outbox inside the same transaction.
             */
            const response = await this.service.post({
                formId: params.formId,
                userId: params.userId,
                email,
                answers: params.answers,
                metadata: params.metadata,
                idempotencyKey: params.idempotencyKey,
                isCompleted: params.isCompleted,
                currentSectionId: params.currentSectionId,
            });

            const submissionId = String(response._id);

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Submission received',
                data: {
                    submissionId,
                    responseId: submissionId,
                    status: 'done',
                },
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
            const { formId, submissionId, userId } = this.getContent(req);
            if (!submissionId) {
                throw AppError.BadRequest('Submission ID is required');
            }

            /**
             * Cold-path endpoint kept for API compatibility. The submission
             * id is the id of the persisted response, and ownership is
             * verified against the form the response belongs to — a guessed
             * id from another user's form resolves to 404.
             */
            const status = await this.service.getSubmission(
                formId,
                submissionId,
                userId
            );

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
