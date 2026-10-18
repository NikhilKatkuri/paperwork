/**
 * Submission-flow tests (direct MongoDB persistence).
 *
 * There is no test framework in this repo, so these run on `node:test` via
 * tsx: `pnpm --filter @paperwork/server test`. They talk to a dedicated
 * database (never the dev one) because `MONGO_URI` is overridden before any
 * app module is imported — `dotenv` only fills variables that are not
 * already set, so the override sticks. App modules are loaded with dynamic
 * imports inside `before()` for the same reason: a static import would be
 * hoisted above the env override.
 */
process.env.MONGO_URI =
    process.env.TEST_MONGO_URI ??
    'mongodb://localhost:27017/paperwork_submission_test';

import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import type { Request, Response, NextFunction } from 'express';

const OWNER = 'submission-test-owner';
const OTHER_USER = 'submission-test-other';

let mongoose: typeof import('mongoose').default;
let connectDB: (retries?: number) => Promise<void>;
let disconnectDB: () => Promise<void>;

let FormsModel: typeof import('@/modules/forms/schemas/schemas.forms').default;
let QuestionsModel: typeof import('@/modules/forms/schemas/schemas.questions').default;
let SectionModel: typeof import('@/modules/forms/schemas/schemas.sections').default;
let FormResponseModel: typeof import('@/modules/forms/schemas/schemas.fill').default;
let ResponseCounterModel: typeof import('@/modules/forms/schemas/schemas.fill').ResponseCounterModel;
let EmailOutboxModel: typeof import('@/modules/email/schema/emailOutbox.model').EmailOutboxModel;
let FillService: typeof import('@/modules/forms/service/service.fill').default;
let emailOutboxService: typeof import('@/modules/email/services/emailOutbox.service').default;
let EmailPriority: typeof import('@/modules/email/types/emailOutbox.type').EmailPriority;

const metadata = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

async function createPublishedForm(overrides: Record<string, unknown> = {}) {
    return FormsModel.create({
        userId: OWNER,
        name: 'Submission Test Form',
        isPublished: true,
        settings: {},
        ...overrides,
    });
}

async function createQuestion(
    formId: unknown,
    overrides: Record<string, unknown> = {}
) {
    return QuestionsModel.create({
        formId: String(formId),
        sectionId: 'section-1',
        index: 0,
        slug: 'question-1',
        type: 'TEXT',
        question: 'Your name',
        ...overrides,
    });
}

function submission(
    formId: unknown,
    questionId: unknown,
    overrides: Record<string, unknown> = {}
) {
    return {
        formId: String(formId),
        userId: OWNER,
        email: 'respondent@example.com',
        answers: [{ questionId: String(questionId), value: ['Alice'] }],
        metadata,
        idempotencyKey: `key-${Math.random().toString(36).slice(2)}`,
        isCompleted: true,
        ...overrides,
    };
}

async function createController() {
    const Controller = (
        await import('@/modules/forms/controllers/controller.fill')
    ).default;
    return new Controller();
}

before(async () => {
    mongoose = (await import('mongoose')).default;
    ({ connectDB, disconnectDB } = await import('@/db/connection'));

    FormsModel = (await import('@/modules/forms/schemas/schemas.forms'))
        .default;
    QuestionsModel = (await import('@/modules/forms/schemas/schemas.questions'))
        .default;
    SectionModel = (await import('@/modules/forms/schemas/schemas.sections'))
        .default;
    ({ default: FormResponseModel, ResponseCounterModel } =
        await import('@/modules/forms/schemas/schemas.fill'));
    ({ EmailOutboxModel } =
        await import('@/modules/email/schema/emailOutbox.model'));
    FillService = (await import('@/modules/forms/service/service.fill'))
        .default;
    emailOutboxService = (
        await import('@/modules/email/services/emailOutbox.service')
    ).default;
    ({ EmailPriority } =
        await import('@/modules/email/types/emailOutbox.type'));

    await connectDB();
    await FormResponseModel.init();
    await mongoose.connection.dropDatabase();
});

beforeEach(async () => {
    await Promise.all([
        FormsModel.deleteMany({}),
        QuestionsModel.deleteMany({}),
        SectionModel.deleteMany({}),
        FormResponseModel.deleteMany({}),
        ResponseCounterModel.deleteMany({}),
        EmailOutboxModel.deleteMany({}),
    ]);
});

after(async () => {
    if (!mongoose) return;

    await mongoose.connection.dropDatabase();
    await disconnectDB();
});

describe('FillService.post — persistence', () => {
    it('stores the response, increments the form counter and enqueues the confirmation email', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);

        const stored = await service.post(
            submission(form._id, question._id, { userId: OWNER })
        );

        assert.ok(stored._id, 'response id is returned');

        const rows = await FormResponseModel.find({}).lean();
        assert.equal(rows.length, 1);
        assert.equal(String(rows[0]!._id), String(stored._id));

        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 1);

        const outbox = await EmailOutboxModel.find({}).lean();
        assert.equal(outbox.length, 1);
        assert.equal(outbox[0]!.type, 'sendFormSubmissionConfirmedEmail');
        assert.equal(
            outbox[0]!.priority,
            EmailPriority.FORM_SUBMISSION_CONFIRMATION
        );
        assert.equal(outbox[0]!.status, 'pending');
        assert.equal(outbox[0]!.payload.email, 'respondent@example.com');
        assert.equal(outbox[0]!.payload.formName, 'Submission Test Form');
        assert.equal(outbox[0]!.payload.submissionId, String(stored._id));
        assert.equal(outbox[0]!.payload.responseId, String(stored._id));
        assert.equal(outbox[0]!.payload.formId, String(form._id));
    });

    it('rejects an answer for a question that does not belong to the form and rolls everything back', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const otherForm = await createPublishedForm();
        const foreignQuestion = await createQuestion(otherForm._id);

        await assert.rejects(
            () => service.post(submission(form._id, foreignQuestion._id)),
            /Invalid questions/
        );

        assert.equal(await FormResponseModel.countDocuments(), 0);
        assert.equal(await EmailOutboxModel.countDocuments(), 0);
        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 0);
    });

    it('rejects values that are not among the configured options', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id, {
            type: 'RADIO',
            optionsConfig: {
                options: [
                    { index: 0, label: 'Yes' },
                    { index: 1, label: 'No' },
                ],
            },
        });

        await assert.rejects(
            () =>
                service.post(
                    submission(form._id, question._id, {
                        answers: [
                            {
                                questionId: String(question._id),
                                value: ['Maybe'],
                            },
                        ],
                    })
                ),
            /is not one of the configured options/
        );

        assert.equal(await FormResponseModel.countDocuments(), 0);
        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 0);
    });

    it('is idempotent for a repeated key: same id, one row, one email', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);
        const payload = submission(form._id, question._id);

        const first = await service.post(payload);
        const second = await service.post(payload);

        assert.equal(String(first._id), String(second._id));
        assert.equal(await FormResponseModel.countDocuments(), 1);
        assert.equal(await EmailOutboxModel.countDocuments(), 1);

        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 1);
    });

    it('collapses concurrent duplicate submissions to a single response', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);
        const payload = submission(form._id, question._id);

        const results = await Promise.all(
            Array.from({ length: 5 }, () => service.post(payload))
        );

        const ids = new Set(results.map((r) => String(r._id)));
        assert.equal(ids.size, 1, 'all attempts resolve to the same response');
        assert.equal(await FormResponseModel.countDocuments(), 1);
        assert.equal(await EmailOutboxModel.countDocuments(), 1);

        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 1);
    });

    it('rolls back the response counter when the per-user limit is hit', async () => {
        const service = new FillService();
        const form = await createPublishedForm({
            settings: { maxResponsesPerUser: 1 },
        });
        const question = await createQuestion(form._id);

        await service.post(submission(form._id, question._id));

        await assert.rejects(
            () => service.post(submission(form._id, question._id)),
            /User submission limit reached/
        );

        assert.equal(await FormResponseModel.countDocuments(), 1);
        assert.equal(await EmailOutboxModel.countDocuments(), 1);

        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 1);

        const counter = await ResponseCounterModel.findById(
            `${String(form._id)}:${OWNER}`
        ).lean();
        assert.equal(counter?.count, 1);
    });

    it('enforces the form-wide maxResponses limit', async () => {
        const service = new FillService();
        const form = await createPublishedForm({
            settings: { maxResponses: 1 },
        });
        const question = await createQuestion(form._id);

        await service.post(submission(form._id, question._id));

        await assert.rejects(
            () => service.post(submission(form._id, question._id)),
            /response limit reached/i
        );

        assert.equal(await FormResponseModel.countDocuments(), 1);
        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 1);
    });

    it('rolls the submission back when the outbox insert fails', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);

        const original = emailOutboxService.addEmailToOutbox;
        emailOutboxService.addEmailToOutbox = async () => {
            throw new Error('outbox unavailable');
        };

        try {
            await assert.rejects(
                () => service.post(submission(form._id, question._id)),
                /outbox unavailable/
            );
        } finally {
            emailOutboxService.addEmailToOutbox = original;
        }

        assert.equal(await FormResponseModel.countDocuments(), 0);
        assert.equal(await EmailOutboxModel.countDocuments(), 0);

        const reloaded = await FormsModel.findById(form._id).lean();
        assert.equal(reloaded?.responseCount, 0);
    });
});

describe('FillService.getSubmission — persisted status', () => {
    it('returns a done status for the owner after persistence', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);

        const stored = await service.post(submission(form._id, question._id));

        const status = await service.getSubmission(
            String(form._id),
            String(stored._id),
            OWNER
        );

        assert.equal(status.status, 'done');
        assert.equal(status.submissionId, String(stored._id));
        assert.equal(status.responseId, String(stored._id));
        assert.equal(status.formId, String(form._id));
        assert.ok(status.submittedAt instanceof Date);
    });

    it('hides submissions of another owner’s form', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);
        const stored = await service.post(submission(form._id, question._id));

        await assert.rejects(
            () =>
                service.getSubmission(
                    String(form._id),
                    String(stored._id),
                    OTHER_USER
                ),
            /Form not found/
        );
    });

    it('returns not-found for an unknown submission id', async () => {
        const service = new FillService();
        const form = await createPublishedForm();
        const unknownId = new mongoose.Types.ObjectId().toString();

        await assert.rejects(
            () => service.getSubmission(String(form._id), unknownId, OWNER),
            /Submission not found/
        );
    });

    it('returns not-found for a malformed submission id', async () => {
        const service = new FillService();
        const form = await createPublishedForm();

        await assert.rejects(
            () => service.getSubmission(String(form._id), 'not-an-id', OWNER),
            /Submission not found/
        );
    });
});

describe('FillController — API contract', () => {
    interface Captured {
        statusCode?: number;
        payload?: {
            success?: boolean;
            message?: string;
            data?: Record<string, unknown>;
        };
        error?: unknown;
    }

    function fakeRequest(formId: string, body: Record<string, unknown>) {
        return {
            user: { id: OWNER, email: 'owner@example.com' },
            params: { formId },
            query: {},
            body,
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
        } as unknown as Request;
    }

    function fakeResponse(captured: Captured) {
        const res = {
            status(code: number) {
                captured.statusCode = code;
                return res;
            },
            json(payload: Captured['payload']) {
                captured.payload = payload;
                return res;
            },
        };
        return res as unknown as Response;
    }

    it('answers 201 with submissionId/responseId/status and persists synchronously', async () => {
        const controller = await createController();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);

        const captured: Captured = {};
        const body = {
            idempotencyKey: 'controller-contract-key',
            answers: [
                {
                    questionId: String(question._id),
                    value: ['Alice'],
                },
            ],
            metadata,
            isCompleted: true,
        };

        await controller.submit(
            fakeRequest(String(form._id), body),
            fakeResponse(captured),
            ((error: unknown) => {
                captured.error = error;
            }) as unknown as NextFunction
        );

        assert.equal(captured.error, undefined);
        assert.equal(captured.statusCode, 201);
        assert.equal(captured.payload?.success, true);
        assert.equal(captured.payload?.data?.status, 'done');
        assert.ok(captured.payload?.data?.submissionId);

        assert.equal(
            String(captured.payload?.data?.submissionId),
            String(captured.payload?.data?.responseId)
        );

        const rows = await FormResponseModel.find({}).lean();
        assert.equal(rows.length, 1);
        assert.equal(
            String(rows[0]!._id),
            captured.payload?.data?.submissionId
        );
        assert.equal(await EmailOutboxModel.countDocuments(), 1);
    });

    it('serves the fill endpoint from MongoDB without a Redis cache', async () => {
        const controller = await createController();
        const form = await createPublishedForm();
        const section = await SectionModel.create({
            formId: String(form._id),
            index: 0,
            title: 'Section 1',
        });
        await createQuestion(form._id, { sectionId: String(section._id) });

        const captured: Captured = {};
        const req = {
            user: { id: OWNER, email: 'owner@example.com' },
            params: { formId: String(form._id) },
            query: {},
            body: {},
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
        } as unknown as Request;

        await controller.fill(req, fakeResponse(captured), ((
            error: unknown
        ) => {
            captured.error = error;
        }) as unknown as NextFunction);

        assert.equal(captured.error, undefined);
        assert.equal(captured.statusCode, 200);
        assert.equal(captured.payload?.success, true);
        assert.ok(captured.payload?.data, 'form payload is returned');
    });

    it('serves the status endpoint from MongoDB for the owner', async () => {
        const controller = await createController();
        const service = new FillService();
        const form = await createPublishedForm();
        const question = await createQuestion(form._id);
        const stored = await service.post(submission(form._id, question._id));

        const captured: Captured = {};
        const req = {
            user: { id: OWNER, email: 'owner@example.com' },
            params: {
                formId: String(form._id),
                submissionId: String(stored._id),
            },
            query: {},
            body: {},
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
        } as unknown as Request;

        await controller.getSubmissionStatus(req, fakeResponse(captured), ((
            error: unknown
        ) => {
            captured.error = error;
        }) as unknown as NextFunction);

        assert.equal(captured.error, undefined);
        assert.equal(captured.statusCode, 200);
        assert.equal(captured.payload?.data?.status, 'done');
        assert.equal(captured.payload?.data?.submissionId, String(stored._id));
    });

    it('next()s a 404 for an unknown submission', async () => {
        const controller = await createController();
        const form = await createPublishedForm();

        const captured: Captured = {};
        const req = {
            user: { id: OWNER, email: 'owner@example.com' },
            params: {
                formId: String(form._id),
                submissionId: new mongoose.Types.ObjectId().toString(),
            },
            query: {},
            body: {},
            headers: { 'user-agent': 'test-agent' },
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
        } as unknown as Request;

        await controller.getSubmissionStatus(req, fakeResponse(captured), ((
            error: unknown
        ) => {
            captured.error = error;
        }) as unknown as NextFunction);

        assert.ok(captured.error);
        assert.equal(
            (captured.error as { statusCode?: number }).statusCode,
            404
        );
    });
});

describe('obsolete infrastructure', () => {
    it('has no submission queue/worker modules or bullmq dependency left', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const serverRoot = path.resolve(__dirname, '..', '..');

        for (const rel of [
            'src/queues/index.ts',
            'src/workers/index.ts',
            'src/workers/SubmissionWorker.ts',
        ]) {
            assert.equal(
                fs.existsSync(path.join(serverRoot, rel)),
                false,
                `${rel} should be deleted`
            );
        }

        const pkg = JSON.parse(
            fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8')
        ) as { dependencies?: Record<string, string> };

        assert.equal(
            Boolean(pkg.dependencies?.bullmq),
            false,
            'bullmq should no longer be a dependency'
        );
    });

    it('has no Redis client, trend module or redis dependency left', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const serverRoot = path.resolve(__dirname, '..', '..');

        for (const rel of ['src/redis/index.ts', 'src/redis/trend.ts']) {
            assert.equal(
                fs.existsSync(path.join(serverRoot, rel)),
                false,
                `${rel} should be deleted`
            );
        }

        const pkg = JSON.parse(
            fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8')
        ) as { dependencies?: Record<string, string> };

        assert.equal(
            Boolean(pkg.dependencies?.ioredis),
            false,
            'ioredis should no longer be a dependency'
        );
    });
});
