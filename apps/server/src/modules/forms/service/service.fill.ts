import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import FormResponseModel, {
    ResponseCounterModel,
} from '@/modules/forms/schemas/schemas.fill';
import emailOutboxService from '@/modules/email/services/emailOutbox.service';
import { EmailPriority } from '@/modules/email/types/emailOutbox.type';

import { FormResponse, ValidationRule } from '@paperwork/types';
import { FormDocument, FormResponseDocument } from '@/types';

import { logError, logger } from '@/utils/logger';

export interface ResponseQuery {
    search?: string;
    questionId?: string;
    sort?: 'newest' | 'oldest';
}

/** Caps for the summary aggregation so free-text answers cannot blow up memory. */
const SUMMARY_MAX_GROUPS = 5000;
const SUMMARY_VALUES_PER_QUESTION = 100;

/** Escape a user string before using it inside a `$regex`. */
function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** MongoDB duplicate-key error (E11000). */
function isDuplicateKeyError(error: unknown): boolean {
    return Boolean(
        error &&
        typeof error === 'object' &&
        (error as { code?: number }).code === 11000
    );
}

/**
 * A transaction that lost a write race (or hit another retryable failure).
 *
 * Submissions used to be processed by a BullMQ worker whose job retries
 * absorbed these conflicts. Now that persistence is synchronous, the
 * transaction itself must retry them, otherwise a double-click can surface
 * as a 500 instead of the (correct) single response.
 */
function isTransientTransactionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as {
        code?: number;
        errorLabels?: string[];
        hasErrorLabel?: (label: string) => boolean;
    };

    // WriteConflict.
    if (candidate.code === 112) return true;

    if (typeof candidate.hasErrorLabel === 'function') {
        return candidate.hasErrorLabel('TransientTransactionError');
    }

    return (
        Array.isArray(candidate.errorLabels) &&
        candidate.errorLabels.includes('TransientTransactionError')
    );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bounded retries for transient transaction conflicts. A double-click burst
 * can pit several same-key submissions against the shared form counter
 * document, so the ceiling is generous but still bounded.
 */
const TRANSACTION_MAX_ATTEMPTS = 5;

/**
 * Build the `$match` for the response list.
 *
 * Search is case-insensitive across the respondent email and any answer value.
 * `questionId` restricts to responses that answered that question.
 */
function buildResponseMatch(
    formId: string,
    options: ResponseQuery = {}
): Record<string, any> {
    const match: Record<string, any> = { formId };

    if (options.questionId) {
        match['answers.questionId'] = options.questionId;
    }

    const search = options.search?.trim();

    if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');

        match.$or = [{ email: pattern }, { 'answers.value': pattern }];
    }

    return match;
}

class FillService {
    private validateEmailDomain(
        email: string,
        allowedDomains: string[]
    ): boolean {
        if (!allowedDomains || allowedDomains.length === 0) return true;

        const domain = email.split('@')[1]?.toLowerCase();

        if (
            !domain ||
            !allowedDomains.map((d) => d.toLowerCase()).includes(domain)
        ) {
            throw AppError.Forbidden(
                `Access restricted. Authorized domains: ${allowedDomains.join(', ')}`
            );
        }
        return true;
    }

    /**
     * Availability checks shared by the fill read and submit paths.
     *
     * The per-user submission limit is intentionally NOT checked here: this
     * runs on every `GET /fill`, and counting the user's responses just to
     * serve a form is wasted work. The limit is enforced on write (`post`).
     */
    verifier(form: FormDocument, userId: string, email?: string) {
        this.assertFormAvailability(form);
        this.assertAllowedDomain(form, userId, email);
        this.assertFormSchedule(form);
        this.assertMaxResponseLimit(form);
    }

    async assertOwner(formId: string, ownerId: string) {
        const form = await FormsModel.findOne({
            _id: formId,
            userId: ownerId,
        })
            .select('_id')
            .lean();
        if (!form) throw AppError.FormNotFound('Form not found');
        return form;
    }

    private assertFormAvailability(form: FormDocument): void {
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        // Domain-restricted forms are stored private but must remain
        // fillable for allowed domains. Truly private forms (no domains)
        // stay hidden.
        const hasDomains =
            Array.isArray((form as any).allowedDomains) &&
            (form as any).allowedDomains.length > 0;
        if (form.isPrivate && !hasDomains) {
            throw AppError.FormNotFound('Form not found');
        }
        if (!form.isPublished) {
            throw AppError.FormNotPublished('Form is not published');
        }
    }

    private assertAllowedDomain(
        form: FormDocument,
        userId: string,
        email?: string
    ): void {
        if (form.allowedDomains && form.allowedDomains.length > 0) {
            const target = email || userId;
            this.validateEmailDomain(target, form.allowedDomains);
        }
    }

    private assertFormSchedule(form: FormDocument): void {
        const now = new Date();
        if (form.settings?.startDate && now < form.settings.startDate) {
            throw AppError.FormNotOpen('Form is not yet open');
        }
        if (form.settings?.closeDate && now > form.settings.closeDate) {
            throw AppError.FormClosed('Form is closed');
        }
    }

    private assertMaxResponseLimit(form: FormDocument): void {
        const maxResponses = form.settings?.maxResponses;
        if (maxResponses !== undefined && form.responseCount !== undefined) {
            if (form.responseCount >= maxResponses) {
                throw AppError.FormClosed('Maximum response limit reached');
            }
        }
    }

    /**
     * Atomic per-user submission limit.
     *
     * A plain `countDocuments` check races: two concurrent submits both see
     * `limit - 1` and both insert. Instead, a per-(form,user) counter is
     * incremented with the limit as a filter — concurrent transactions
     * touching the same counter document conflict, so at most `limit`
     * transactions ever commit. An aborted transaction rolls the increment
     * back together with the response.
     */
    private async claimUserSubmissionSlot(
        formId: string,
        userId: string,
        limit: number,
        session: mongoose.ClientSession
    ): Promise<void> {
        const counterId = `${formId}:${userId}`;

        // Seed from existing responses so a limit added after the fact (or
        // legacy rows predating the counter) still counts correctly.
        const existingCount = await FormResponseModel.countDocuments({
            formId,
            userId,
        }).session(session);

        await ResponseCounterModel.updateOne(
            { _id: counterId },
            { $setOnInsert: { count: existingCount } },
            { upsert: true, session }
        );

        const granted = await ResponseCounterModel.findOneAndUpdate(
            { _id: counterId, count: { $lt: limit } },
            { $inc: { count: 1 } },
            { session, returnDocument: 'after' }
        ).lean();

        if (!granted) {
            throw AppError.FormClosed('User submission limit reached');
        }
    }

    /**
     * Strict per-question answer validation.
     *
     * Presence of required answers is deliberately NOT enforced here: with
     * conditional navigation the server cannot know which sections the
     * respondent actually visited (skipped sections must not block submit),
     * so requiredness stays a client-side concern. Values that ARE sent are
     * checked against the question's own configuration.
     */
    private assertAnswerValid(
        question: Record<string, any>,
        values: string[]
    ): void {
        const fail = (message: string) => {
            throw AppError.BadRequest(
                `Invalid answer for "${question.question ?? 'question'}": ${message}`
            );
        };

        switch (question.type) {
            case 'RADIO':
            case 'DROP_DOWN':
            case 'CHOICE': {
                const options: { label?: unknown }[] =
                    question.optionsConfig?.options ?? [];

                if (options.length) {
                    const labels = new Set(
                        options.map((option) => String(option.label))
                    );
                    for (const value of values) {
                        if (!labels.has(value)) {
                            fail(
                                `"${value}" is not one of the configured options`
                            );
                        }
                    }
                }

                if (question.type !== 'CHOICE' && values.length > 1) {
                    fail('only one option may be selected');
                }
                break;
            }

            case 'LINEAR_SCALE': {
                const config = question.scaleConfig;
                if (config && values.length === 1) {
                    const n = Number(values[0]);
                    if (
                        !Number.isFinite(n) ||
                        n < config.lowerBound ||
                        n > config.upperBound
                    ) {
                        fail(
                            `value must be a number between ${config.lowerBound} and ${config.upperBound}`
                        );
                    }
                }
                break;
            }

            case 'RATING': {
                const config = question.ratingConfig;
                if (config && values.length === 1) {
                    const n = Number(values[0]);
                    if (!Number.isInteger(n) || n < 1 || n > config.scale) {
                        fail(
                            `rating must be a whole number between 1 and ${config.scale}`
                        );
                    }
                }
                break;
            }

            default:
                break;
        }

        const rule: ValidationRule | undefined = question.validationRule;
        if (rule) this.assertValidationRule(rule, values, fail);
    }

    private assertValidationRule(
        rule: ValidationRule,
        values: string[],
        fail: (message: string) => never
    ): void {
        const first = values[0] ?? '';

        switch (rule.ruleType) {
            case 'EMAIL':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(first)) {
                    fail(
                        rule.customErrorMessage ??
                            'must be a valid email address'
                    );
                }
                break;

            case 'URL': {
                let valid = false;
                try {
                    const url = new URL(first);
                    valid =
                        url.protocol === 'http:' || url.protocol === 'https:';
                } catch {
                    valid = false;
                }
                if (!valid) {
                    fail(rule.customErrorMessage ?? 'must be a valid URL');
                }
                break;
            }

            case 'MIN_CHAR_COUNT':
                if (values.join(' ').length < rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `must be at least ${rule.value} characters`
                    );
                }
                break;

            case 'MAX_CHAR_COUNT':
                if (values.join(' ').length > rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `must be at most ${rule.value} characters`
                    );
                }
                break;

            case 'CHECKBOX_MIN_SELECT':
                if (values.length < rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `select at least ${rule.value} option(s)`
                    );
                }
                break;

            case 'CHECKBOX_MAX_SELECT':
                if (values.length > rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `select at most ${rule.value} option(s)`
                    );
                }
                break;

            case 'NUMBER_GREATER_THAN': {
                const n = Number(first);
                if (!Number.isFinite(n) || n <= rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `must be greater than ${rule.value}`
                    );
                }
                break;
            }

            case 'NUMBER_LESS_THAN': {
                const n = Number(first);
                if (!Number.isFinite(n) || n >= rule.value) {
                    fail(
                        rule.customErrorMessage ??
                            `must be less than ${rule.value}`
                    );
                }
                break;
            }

            case 'NUMBER_BETWEEN': {
                const n = Number(first);
                if (!Number.isFinite(n) || n < rule.min || n > rule.max) {
                    fail(
                        rule.customErrorMessage ??
                            `must be a number between ${rule.min} and ${rule.max}`
                    );
                }
                break;
            }

            case 'REGEX_MATCH': {
                try {
                    const pattern = new RegExp(rule.pattern);
                    if (!pattern.test(first)) {
                        fail(
                            rule.customErrorMessage ??
                                'does not match the required format'
                        );
                    }
                } catch {
                    // An unparsable pattern was accepted at build time by a
                    // bug; skip the check rather than blocking submissions.
                }
                break;
            }
        }
    }

    async get(formId: string, userId: string, email?: string) {
        // All three reads are independent: fetch them concurrently, then
        // verify the form. A missing/unavailable form still throws the
        // correct status via `verifier`.
        const [form, sections, allQuestions] = await Promise.all([
            FormsModel.findById(formId).select('-__v').lean(),
            SectionModel.find({ formId })
                .sort({ index: 1 })
                .select('-__v -createdAt -updatedAt')
                .lean(),
            QuestionsModel.find({ formId })
                .sort({ index: 1 })
                .select('-__v -createdAt -updatedAt')
                .lean(),
        ]);

        this.verifier(form as FormDocument, userId, email);

        if (!sections.length)
            throw AppError.SectionNotFound('Form has no content');

        const questionsBySection = allQuestions.reduce(
            (acc, q) => {
                const sId = q.sectionId.toString();
                acc[sId] ??= [];
                acc[sId].push(q);
                return acc;
            },
            {} as Record<string, any[]>
        );

        const nestedSections = sections.map((section) => ({
            ...section,
            questions: questionsBySection[section._id.toString()] || [],
        }));

        return {
            form,
            sections: nestedSections,
        };
    }

    async post(data: FormResponse): Promise<FormResponseDocument> {
        const { formId, answers, idempotencyKey } = data;

        // Basic shape validation: valid question IDs, no duplicates,
        // non-empty values. Full per-rule validation happens per question
        // type where config is available; at minimum reject junk.
        if (!Array.isArray(answers) || answers.length === 0) {
            throw AppError.BadRequest('Answers are required');
        }

        /**
         * Bounded retry loop.
         *
         * - Idempotent replay: the same key for the same form returns the
         *   already-stored response instead of creating a second one. The
         *   unique index closes the concurrent-submit race; the replay is
         *   re-checked on every attempt because a competing transaction may
         *   have committed between attempts.
         * - Transient conflicts (WriteConflict / TransientTransactionError)
         *   used to be absorbed by BullMQ job retries. Persistence is
         *   synchronous now, so the transaction retries itself a few times
         *   with jitter before surfacing an error.
         */
        for (let attempt = 1; ; attempt++) {
            if (idempotencyKey) {
                const existing = await FormResponseModel.findOne({
                    formId,
                    idempotencyKey,
                }).lean();
                if (existing) return existing as FormResponseDocument;
            }

            try {
                return await this.persistWithTransaction(data);
            } catch (error) {
                // Concurrent duplicate: two submissions with the same key
                // raced and the unique index rejected the loser. Return the
                // stored one; if it is not visible yet the winning
                // transaction may still be committing, so retry.
                if (isDuplicateKeyError(error) && idempotencyKey) {
                    const existing = await FormResponseModel.findOne({
                        formId,
                        idempotencyKey,
                    }).lean();
                    if (existing) return existing as FormResponseDocument;
                    if (attempt < TRANSACTION_MAX_ATTEMPTS) {
                        await sleep(
                            25 * attempt + Math.floor(Math.random() * 25)
                        );
                        continue;
                    }
                    throw error;
                }

                if (
                    attempt < TRANSACTION_MAX_ATTEMPTS &&
                    isTransientTransactionError(error)
                ) {
                    await sleep(25 * attempt + Math.floor(Math.random() * 25));
                    continue;
                }

                throw error;
            }
        }
    }

    /**
     * The actual write, inside one MongoDB transaction:
     *   response counter increment → availability/limits → answer validation
     *   → response insert → confirmation-email outbox insert.
     *
     * The outbox record must belong to the same transaction as the response:
     * a committed response without its confirmation email (or an email for a
     * rolled-back response) would both be wrong. `addEmailToOutbox` only
     * writes the outbox row — the email itself is sent later by the outbox
     * worker, never inside the transaction.
     */
    private async persistWithTransaction(
        data: FormResponse
    ): Promise<FormResponseDocument> {
        const {
            formId,
            userId,
            email,
            answers,
            metadata,
            idempotencyKey,
            isCompleted,
            currentSectionId,
        } = data;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            /**
             * Availability/authorization/schedule/limit checks run against
             * the pre-increment document. The `$inc` below is the atomic
             * guard for `maxResponses`; verifying the post-increment
             * document would count the current submission twice and reject
             * the first response of a form with `maxResponses: 1`.
             */
            const form = await FormsModel.findById(formId)
                .session(session)
                .lean();

            if (!form) {
                throw AppError.FormNotFound('Form not found');
            }

            this.verifier(form as FormDocument, userId, email);

            const updatedForm = await FormsModel.findOneAndUpdate(
                {
                    _id: formId,
                    $or: [
                        { 'settings.maxResponses': { $exists: false } },
                        {
                            $expr: {
                                $lt: [
                                    '$responseCount',
                                    '$settings.maxResponses',
                                ],
                            },
                        },
                    ],
                },
                { $inc: { responseCount: 1 } },
                { session, returnDocument: 'after' }
            ).lean();

            if (!updatedForm) {
                throw AppError.BadRequest(
                    'Response limit reached or form unavailable'
                );
            }

            const limit = updatedForm.settings?.maxResponsesPerUser;
            if (limit && userId) {
                await this.claimUserSubmissionSlot(
                    formId,
                    userId,
                    limit,
                    session
                );
            }

            // One read gives both the validity set and the configuration
            // needed to validate each answer against its own question.
            const questions = await QuestionsModel.find({ formId })
                .select(
                    '_id question type optionsConfig ratingConfig scaleConfig validationRule'
                )
                .session(session)
                .lean();

            const questionById = new Map(
                questions.map((question) => [
                    question._id.toString(),
                    question as Record<string, any>,
                ])
            );

            const seen = new Set<string>();
            for (const ans of answers) {
                const qid = ans?.questionId?.toString();
                if (!qid || !questionById.has(qid)) {
                    throw AppError.BadRequest('Invalid questions');
                }
                if (seen.has(qid)) {
                    throw AppError.BadRequest('Duplicate answers for question');
                }
                seen.add(qid);
                const vals = (ans as any).value;
                if (
                    !Array.isArray(vals) ||
                    vals.length === 0 ||
                    vals.some(
                        (v: unknown) => typeof v !== 'string' || v.trim() === ''
                    )
                ) {
                    throw AppError.BadRequest(
                        'Answer values must be non-empty strings'
                    );
                }

                this.assertAnswerValid(questionById.get(qid)!, vals);
            }

            const response = await FormResponseModel.create(
                [
                    {
                        formId,
                        userId,
                        email,
                        answers,
                        metadata,
                        idempotencyKey,
                        isCompleted,
                        currentSectionId,
                    },
                ],
                { session }
            );

            const created = response[0];
            if (!created) {
                throw AppError.Internal('Failed to save response');
            }

            const responseId = created._id.toString();

            /**
             * Confirmation email, enqueued in the same transaction as the
             * response. A recipient is required to send anything, so the
             * guard matches the old worker's; the response schema also
             * requires an email, making it defensive.
             */
            if (email) {
                await emailOutboxService.addEmailToOutbox(
                    {
                        type: 'sendFormSubmissionConfirmedEmail',
                        payload: {
                            submissionId: responseId,
                            responseId,
                            email,
                            formId,
                            formName: updatedForm.name ?? 'Form',
                        },
                        priority: EmailPriority.FORM_SUBMISSION_CONFIRMATION,
                    },
                    session
                );
            }

            await session.commitTransaction();
            return created;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Submission status, read from persisted data.
     *
     * The submission id is the id of the stored response (the same value the
     * submit endpoint returns), so a replay with the same idempotency key
     * resolves to the same id. Ownership is verified against the form.
     */
    async getSubmission(
        formId: string,
        submissionId: string,
        ownerId?: string
    ) {
        try {
            if (ownerId) await this.assertOwner(formId, ownerId);
            else {
                const form = await FormsModel.findById(formId).lean();
                if (!form) throw AppError.FormNotFound('Form not found');
            }

            if (!mongoose.isValidObjectId(submissionId)) {
                throw AppError.NotFound('Submission not found');
            }

            const response = (await FormResponseModel.findOne({
                _id: submissionId,
                formId,
            })
                .select('_id formId createdAt')
                .lean()) as {
                _id: unknown;
                formId?: unknown;
                createdAt?: Date;
            } | null;

            if (!response) throw AppError.NotFound('Submission not found');

            const id = String(response._id);

            return {
                submissionId: id,
                responseId: id,
                formId: String(response.formId ?? formId),
                status: 'done' as const,
                createdAt: response.createdAt,
                submittedAt: response.createdAt,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error instanceof mongoose.Error.CastError) {
                throw AppError.NotFound('Submission not found');
            }
            logError(logger, 'form.submission_status_failed', error, {
                event: 'DB_QUERY_FAILED',
                formId,
                submissionId,
            });
            throw AppError.Internal('Failed to load submission status');
        }
    }

    async responses(
        formId: string,
        page: number = 1,
        limit: number = 20,
        options: ResponseQuery = {},
        ownerId?: string
    ) {
        if (ownerId) await this.assertOwner(formId, ownerId);
        else {
            const form = await FormsModel.findById(formId).lean();
            if (!form) throw AppError.FormNotFound('Form not found');
        }

        // Bounded again here so a caller bypassing validation cannot ask for
        // the whole collection in one page.
        const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 20), 100);
        const safePage = Math.max(1, Math.trunc(page) || 1);
        const skip = (safePage - 1) * safeLimit;

        const direction = options.sort === 'oldest' ? 1 : -1;

        const result = await FormResponseModel.aggregate([
            { $match: buildResponseMatch(formId.toString(), options) },
            {
                $facet: {
                    data: [
                        {
                            // `_id` breaks ties: without it, rows sharing a
                            // millisecond timestamp could repeat or vanish
                            // across pages.
                            $sort: { createdAt: direction, _id: direction },
                        },
                        { $skip: skip },
                        { $limit: safeLimit },
                        { $project: { __v: 0, updatedAt: 0 } },
                    ],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const responses = result[0]?.data ?? [];
        const total = result[0]?.totalCount[0]?.count || 0;

        return {
            responses,
            pagination: {
                currentPage: safePage,
                totalPages: Math.ceil(total / safeLimit),
                total,
                limit: safeLimit,
            },
        };
    }

    /**
     * Per-question totals across every response, not just one page, so the
     * summary does not change as the user pages through the list.
     */
    async responsesSummary(
        formId: string,
        options: ResponseQuery = {},
        ownerId?: string
    ) {
        if (ownerId) await this.assertOwner(formId, ownerId);
        else {
            const form = await FormsModel.findById(formId).lean();
            if (!form) throw AppError.FormNotFound('Form not found');
        }

        const match = buildResponseMatch(formId.toString(), options);

        /**
         * One round-trip instead of countDocuments + aggregate. `$facet`
         * computes the total and the per-value breakdown from the same
         * cursor position, so the counts and rows cannot disagree mid-write.
         *
         * Free-text questions can produce arbitrarily many distinct values,
         * so the group stage is bounded: the top GROUPS results by count.
         * `answered` is derived from those groups (a value that only occurs
         * once can fall off the tail on extremely diverse forms).
         */
        const result = await FormResponseModel.aggregate([
            { $match: match },
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    breakdown: [
                        { $unwind: '$answers' },
                        { $unwind: '$answers.value' },
                        {
                            $group: {
                                _id: {
                                    questionId: '$answers.questionId',
                                    value: '$answers.value',
                                },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { count: -1 } },
                        { $limit: SUMMARY_MAX_GROUPS },
                    ],
                },
            },
        ])
            .allowDiskUse(true)
            .option({ maxTimeMS: 10_000 })
            .exec();

        const totalResponses = result[0]?.total?.[0]?.count ?? 0;
        const breakdown: {
            _id: { questionId: string; value: string };
            count: number;
        }[] = result[0]?.breakdown ?? [];

        const byQuestion = new Map<
            string,
            { answered: number; values: { value: string; count: number }[] }
        >();

        breakdown.forEach((row) => {
            const { questionId, value } = row._id;
            const entry = byQuestion.get(questionId) ?? {
                answered: 0,
                values: [],
            };

            entry.values.push({ value, count: row.count });
            entry.answered += row.count;
            byQuestion.set(questionId, entry);
        });

        const questions = [...byQuestion.entries()].map(
            ([questionId, entry]) => ({
                questionId,
                answered: entry.answered,
                // The top values per question; the query is pre-sorted by
                // count so a simple slice preserves the most-answered first.
                values: entry.values.slice(0, SUMMARY_VALUES_PER_QUESTION),
            })
        );

        return { totalResponses, questions };
    }

    async getResponse(formId: string, responseId: string, ownerId?: string) {
        if (ownerId) await this.assertOwner(formId, ownerId);
        else {
            const form = await FormsModel.findById(formId).lean();
            if (!form) throw AppError.FormNotFound('Form not found');
        }

        const response = await FormResponseModel.findOne({
            _id: responseId,
            formId,
        })
            .select('-__v -updatedAt')
            .lean();
        if (!response) throw AppError.ResponseNotFound('Response not found');

        return response;
    }

    /**
     * Streaming export.
     *
     * Returns a cursor instead of a materialised string: the controller
     * pipes it through a CSV serializer straight to the socket, so memory
     * stays flat regardless of response count and a client abort stops the
     * DB read (the cursor is closed when iteration stops).
     *
     * Columns are keyed by question id, not by title, so two questions
     * sharing a title can no longer overwrite each other's column.
     */
    async exportResponses(
        formId: string,
        exportType: string,
        ownerId?: string,
        options: ResponseQuery = {}
    ): Promise<{
        cursor: AsyncIterable<Record<string, any>>;
        questionIdToColumn: Map<string, string>;
        columns: string[];
    }> {
        if (exportType.toLowerCase() !== 'csv') {
            throw AppError.BadRequest('Unsupported export type');
        }

        try {
            if (ownerId) await this.assertOwner(formId, ownerId);
            else {
                const form = await FormsModel.findById(formId).lean();
                if (!form) throw AppError.FormNotFound('Form not found');
            }

            const questions = await QuestionsModel.find({ formId })
                .sort({ index: 1 })
                .select('_id question')
                .lean();

            if (!questions.length)
                throw AppError.QuestionNotFound(
                    'No questions found for this form'
                );

            // Cheap indexed count so "nothing to export" is a 400 rather
            // than a headers-only CSV.
            const total = await FormResponseModel.countDocuments(
                buildResponseMatch(formId, options)
            );
            if (total === 0) {
                throw AppError.BadRequest('No responses to export');
            }

            const seen = new Map<string, number>();
            const questionIdToColumn = new Map<string, string>();
            const columns: string[] = ['email', 'submittedAt'];

            for (const question of questions) {
                const base =
                    String(question.question ?? '').trim() ||
                    'Untitled question';
                const n = seen.get(base) ?? 0;
                seen.set(base, n + 1);

                const column = n === 0 ? base : `${base} (${n + 1})`;
                questionIdToColumn.set(String(question._id), column);
                columns.push(column);
            }

            const cursor = FormResponseModel.find(
                buildResponseMatch(formId, options)
            )
                .sort({ createdAt: -1, _id: -1 })
                .select('email answers.questionId answers.value createdAt')
                .lean()
                .cursor({ batchSize: 500 });

            return {
                cursor: cursor as unknown as AsyncIterable<Record<string, any>>,
                questionIdToColumn,
                columns,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error instanceof mongoose.Error.CastError) {
                throw AppError.BadRequest('Invalid id');
            }
            logError(logger, 'form.responses_export_failed', error, {
                event: 'DB_QUERY_FAILED',
                formId,
            });
            throw AppError.Internal('Failed to export responses');
        }
    }
}

export default FillService;
