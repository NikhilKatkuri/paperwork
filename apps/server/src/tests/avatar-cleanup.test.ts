/**
 * Profile-avatar replacement tests.
 *
 * Same conventions as `submission-flow.test.ts`: a dedicated database
 * (never the dev one) because `MONGO_URI` is overridden before any app
 * module is imported, and app modules are loaded with dynamic imports
 * inside `before()` so the override sticks.
 *
 * Cloudinary's SDK `destroy` is always mocked — no test may reach the real
 * API — while the rest of the pipeline (schema, service, Mongo writes) runs
 * for real. Assertions check both invariants: the previous asset is deleted
 * only after the database moved on, and the currently referenced asset is
 * never deleted. Failed inline deletions must land in the durable cleanup
 * outbox, whose worker is driven step-by-step (never `start()`ed) here.
 */
process.env.MONGO_URI =
    process.env.TEST_MONGO_URI ??
    'mongodb://localhost:27017/paperwork_avatar_cleanup_test';

import assert from 'node:assert/strict';
import {
    after,
    afterEach,
    before,
    beforeEach,
    describe,
    it,
    mock,
} from 'node:test';

import { v2 as cloudinary } from 'cloudinary';

let mongoose: typeof import('mongoose').default;
let connectDB: (retries?: number) => Promise<void>;
let disconnectDB: () => Promise<void>;

let ProfileModel: typeof import('@/modules/auth/schemas/profile.schema').default;
let ProfileRepo: typeof import('@/modules/auth/repository/profile.repository').default;
let AuthServiceBoot: typeof import('@/modules/auth/service/auth.service').default;
let cloudinaryLogger: typeof import('@/modules/signatures/cloudinary/service/cloudinary.service').cloudinaryLogger;
let assetUtils: typeof import('@/modules/signatures/cloudinary/utils/cloudinary.asset');
let AvatarCleanupOutboxModel: typeof import('@/modules/signatures/cloudinary/schema/avatarCleanupOutbox.model').default;
let avatarCleanupOutboxService: typeof import('@/modules/signatures/cloudinary/service/avatarCleanupOutbox.service').default;
let avatarCleanupWorker: typeof import('@/modules/signatures/cloudinary/workers/avatarCleanupOutbox.worker').default;
let workerLogger: typeof import('@/utils/logger').workerLogger;
let config: typeof import('@/config').default;

let folder: string;
let destroyCalls: string[];
let destroyImpl: (publicId: string) => Promise<{ result: string }>;

const URL_VERSION = '1792313275';

const newUserId = () => new mongoose.Types.ObjectId();

const scope = () => ({
    cloudName: config.cloudinary.cloud_name,
    folder,
});

const publicId = (name: string) => `${folder}/${name}`;

const assetUrl = (id: string, version = URL_VERSION) =>
    `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/v${version}/${id}.jpg`;

async function createProfile(overrides: Record<string, unknown> = {}) {
    return ProfileModel.create({
        userId: newUserId(),
        fullName: 'Avatar Tester',
        ...overrides,
    });
}

async function seedJob(overrides: Record<string, unknown> = {}) {
    return AvatarCleanupOutboxModel.create({
        publicId: publicId('queued'),
        userId: String(newUserId()),
        status: 'pending',
        attempts: 0,
        nextAttemptAt: new Date(Date.now() - 1000),
        lockedAt: null,
        lockedBy: null,
        ...overrides,
    });
}

before(async () => {
    mongoose = (await import('mongoose')).default;
    ({ connectDB, disconnectDB } = await import('@/db/connection'));

    ProfileModel = (await import('@/modules/auth/schemas/profile.schema'))
        .default;
    ProfileRepo = (await import('@/modules/auth/repository/profile.repository'))
        .default;
    AuthServiceBoot = (await import('@/modules/auth/service/auth.service'))
        .default;
    ({ cloudinaryLogger } =
        await import('@/modules/signatures/cloudinary/service/cloudinary.service'));
    assetUtils =
        await import('@/modules/signatures/cloudinary/utils/cloudinary.asset');
    AvatarCleanupOutboxModel = (
        await import('@/modules/signatures/cloudinary/schema/avatarCleanupOutbox.model')
    ).default;
    avatarCleanupOutboxService = (
        await import('@/modules/signatures/cloudinary/service/avatarCleanupOutbox.service')
    ).default;
    avatarCleanupWorker = (
        await import('@/modules/signatures/cloudinary/workers/avatarCleanupOutbox.worker')
    ).default;
    ({ workerLogger } = await import('@/utils/logger'));
    config = (await import('@/config')).default;
    folder = config.cloudinary.named_folder;

    await connectDB();
    await mongoose.connection.dropDatabase();
});

beforeEach(async () => {
    await ProfileModel.deleteMany({});
    await AvatarCleanupOutboxModel.deleteMany({});

    destroyCalls = [];
    destroyImpl = async () => ({ result: 'ok' });

    mock.method(cloudinary.uploader, 'destroy', async (publicId: string) => {
        destroyCalls.push(publicId);
        return destroyImpl(publicId);
    });
});

afterEach(() => {
    mock.restoreAll();
});

after(async () => {
    if (!mongoose) return;

    await mongoose.connection.dropDatabase();
    await disconnectDB();
});

describe('extractCloudinaryPublicId', () => {
    it('extracts the public id from an owned upload-delivery URL', () => {
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                assetUrl(publicId('r3hqbxaaoqzedida00vg')),
                scope()
            ),
            publicId('r3hqbxaaoqzedida00vg')
        );
    });

    it('decodes percent-encoded public ids', () => {
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                assetUrl(`${folder}/my%20photo`),
                scope()
            ),
            `${folder}/my photo`
        );
    });

    it('rejects URLs from another cloud, host, protocol or delivery type', () => {
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://res.cloudinary.com/not-our-cloud/image/upload/v${URL_VERSION}/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://example.com/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `http://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/v${URL_VERSION}/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://res.cloudinary.com/${config.cloudinary.cloud_name}/video/upload/v${URL_VERSION}/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
    });

    it('rejects transformed and version-less deliveries', () => {
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/c_fill,w_100/v${URL_VERSION}/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/${publicId('x')}.jpg`,
                scope()
            ),
            null
        );
    });

    it('rejects assets outside the configured folder or without a path', () => {
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                assetUrl('another-folder/x'),
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                `https://res.cloudinary.com/${config.cloudinary.cloud_name}/image/upload/v${URL_VERSION}/`,
                scope()
            ),
            null
        );
        assert.equal(
            assetUtils.extractCloudinaryPublicId(
                'randomuser:name=x&color=y',
                scope()
            ),
            null
        );
    });

    it('isOwnedPublicId only accepts ids inside the configured folder', () => {
        assert.equal(assetUtils.isOwnedPublicId(publicId('x'), folder), true);
        assert.equal(assetUtils.isOwnedPublicId('other/x', folder), false);
        assert.equal(assetUtils.isOwnedPublicId(null, folder), false);
        assert.equal(assetUtils.isOwnedPublicId(publicId('x'), ''), false);
    });
});

describe('updateProfileService — avatar replacement', () => {
    it('deletes the previous asset extracted from its stored URL', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-1');
        const newId = publicId('new-1');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        const updated = await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(newId),
        });

        assert.equal(updated.avatarUrl, assetUrl(newId));
        assert.deepEqual(destroyCalls, [oldId]);
        assert.equal(await AvatarCleanupOutboxModel.countDocuments({}), 0);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.equal(row?.avatarUrl, assetUrl(newId));
    });

    it('does not touch Cloudinary when the database update fails', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-2');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        mock.method(ProfileRepo, 'updateProfile', async () => {
            throw new Error('mongo unavailable');
        });

        await assert.rejects(
            () =>
                AuthServiceBoot.updateProfileService(userId, {
                    avatarUrl: assetUrl(publicId('new-2')),
                }),
            /Failed to update profile/
        );

        assert.deepEqual(destroyCalls, []);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.equal(row?.avatarUrl, assetUrl(oldId));
    });

    it('keeps the profile update and queues a background retry when deletion fails', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-3');
        const newId = publicId('new-3');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };

        const errors: unknown[][] = [];
        mock.method(cloudinaryLogger, 'error', (...args: unknown[]) => {
            errors.push(args);
            return cloudinaryLogger;
        });

        const updated = await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(newId),
        });

        assert.equal(updated.avatarUrl, assetUrl(newId));
        assert.deepEqual(destroyCalls, [oldId]);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.equal(row?.avatarUrl, assetUrl(newId));

        const jobs = await AvatarCleanupOutboxModel.find({}).lean();
        assert.equal(jobs.length, 1);
        assert.equal(jobs[0]!.publicId, oldId);
        assert.equal(jobs[0]!.userId, userId);
        assert.equal(jobs[0]!.status, 'pending');
        assert.equal(jobs[0]!.attempts, 0);
        assert.match(jobs[0]!.lastError ?? '', /cloudinary unreachable/);

        assert.equal(errors.length, 1);
        const meta = errors[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_QUEUED');
        assert.equal(meta.publicId, oldId);
        assert.equal(meta.userId, userId);
    });

    it('logs a last-resort failure when even the retry queue is unavailable', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-queue-down');
        const newId = publicId('new-queue-down');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };
        mock.method(avatarCleanupOutboxService, 'enqueue', async () => {
            throw new Error('mongo unavailable');
        });

        const errors: unknown[][] = [];
        mock.method(cloudinaryLogger, 'error', (...args: unknown[]) => {
            errors.push(args);
            return cloudinaryLogger;
        });

        const updated = await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(newId),
        });

        assert.equal(updated.avatarUrl, assetUrl(newId));
        assert.deepEqual(destroyCalls, [oldId]);
        assert.equal(await AvatarCleanupOutboxModel.countDocuments({}), 0);

        assert.equal(errors.length, 1);
        const meta = errors[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_FAILED');
        assert.equal(meta.reason, 'enqueue_failed');
        assert.equal(meta.publicId, oldId);
        assert.equal(meta.userId, userId);
    });

    it('treats a "not found" destroy result as success', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-4');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        destroyImpl = async () => ({ result: 'not found' });

        const errors: unknown[][] = [];
        mock.method(cloudinaryLogger, 'error', (...args: unknown[]) => {
            errors.push(args);
            return cloudinaryLogger;
        });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(publicId('new-4')),
        });

        assert.deepEqual(destroyCalls, [oldId]);
        assert.equal(errors.length, 0);
        assert.equal(await AvatarCleanupOutboxModel.countDocuments({}), 0);
    });

    it('skips deletion when the profile had no previous avatar', async () => {
        const userId = String(newUserId());
        await createProfile({ userId });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(publicId('new-5')),
        });

        assert.deepEqual(destroyCalls, []);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.equal(row?.avatarUrl, assetUrl(publicId('new-5')));
    });

    it('skips deletion for non-avatar updates and unchanged avatars', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-6');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        await AuthServiceBoot.updateProfileService(userId, {
            fullName: 'Renamed',
        });
        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(oldId),
        });

        assert.deepEqual(destroyCalls, []);
    });

    it('never deletes the asset the new avatar references', async () => {
        const userId = String(newUserId());
        const sharedId = publicId('shared-7');
        await createProfile({
            userId,
            avatarUrl: assetUrl(sharedId, '1700000000'),
        });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(sharedId, '1799999999'),
        });

        assert.deepEqual(destroyCalls, []);
    });

    it('skips and logs when the previous avatar URL is not an owned asset', async () => {
        const userId = String(newUserId());
        await createProfile({
            userId,
            avatarUrl: 'randomuser:name=Test&color=hsl(1,2,3)',
        });

        const warnings: unknown[][] = [];
        mock.method(cloudinaryLogger, 'warn', (...args: unknown[]) => {
            warnings.push(args);
            return cloudinaryLogger;
        });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(publicId('new-8')),
        });

        assert.deepEqual(destroyCalls, []);
        assert.equal(warnings.length, 1);
        const meta = warnings[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_SKIPPED');
        assert.equal(meta.reason, 'public_id_not_derivable');
    });

    it('deletes the previous asset when the avatar changes to a non-owned URL', async () => {
        const userId = String(newUserId());
        const oldId = publicId('old-9');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: 'https://example.com/avatar.png',
        });

        assert.deepEqual(destroyCalls, [oldId]);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.equal(row?.avatarUrl, 'https://example.com/avatar.png');
    });

    it('handles repeated replacements in sequence', async () => {
        const userId = String(newUserId());
        const firstId = publicId('seq-1');
        const secondId = publicId('seq-2');
        const thirdId = publicId('seq-3');
        await createProfile({ userId, avatarUrl: assetUrl(firstId) });

        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(secondId),
        });
        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(thirdId),
        });

        assert.deepEqual(destroyCalls, [firstId, secondId]);
    });

    it('never deletes the currently referenced asset when updates race', async () => {
        const userId = String(newUserId());
        const oldId = publicId('race-old');
        const firstId = publicId('race-first');
        const secondId = publicId('race-second');
        await createProfile({ userId, avatarUrl: assetUrl(oldId) });

        await Promise.all([
            AuthServiceBoot.updateProfileService(userId, {
                avatarUrl: assetUrl(firstId),
            }),
            AuthServiceBoot.updateProfileService(userId, {
                avatarUrl: assetUrl(secondId),
            }),
        ]);

        const row = await ProfileModel.findOne({ userId }).lean();
        assert.ok(
            row?.avatarUrl === assetUrl(firstId) ||
                row?.avatarUrl === assetUrl(secondId)
        );

        const currentId = assetUtils.extractCloudinaryPublicId(
            row?.avatarUrl,
            scope()
        );
        assert.ok(
            !currentId || !destroyCalls.includes(currentId),
            'the asset the profile currently references must never be deleted'
        );
    });
});

describe('avatar cleanup outbox — background retry', () => {
    it('processes a due job and marks it done', async () => {
        const userId = String(newUserId());
        const queuedId = publicId('worker-1');
        await createProfile({
            userId,
            avatarUrl: assetUrl(publicId('worker-current-1')),
        });
        const job = await seedJob({ publicId: queuedId, userId });

        const processed = await avatarCleanupWorker.processNextJob();

        assert.equal(processed, true);
        assert.deepEqual(destroyCalls, [queuedId]);

        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'done');
        assert.ok(row?.doneAt);
        assert.equal(row?.lockedAt, null);
        assert.equal(row?.lockedBy, null);
    });

    it('treats a "not found" retry as success', async () => {
        destroyImpl = async () => ({ result: 'not found' });
        const job = await seedJob();

        await avatarCleanupWorker.processNextJob();

        assert.equal(destroyCalls.length, 1);
        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'done');
    });

    it('schedules the next attempt with backoff when the retry fails', async () => {
        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };
        const job = await seedJob();

        await avatarCleanupWorker.processNextJob();

        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'pending');
        assert.equal(row?.attempts, 1);
        assert.ok(
            (row?.nextAttemptAt.getTime() ?? 0) > Date.now(),
            'a failed attempt must not be retried immediately'
        );
        assert.match(row?.lastError ?? '', /cloudinary unreachable/);
    });

    it('marks the job failed and logs exhaustion after max attempts', async () => {
        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };
        const job = await seedJob({ attempts: 4 });

        const errors: unknown[][] = [];
        mock.method(workerLogger, 'error', (...args: unknown[]) => {
            errors.push(args);
            return workerLogger;
        });

        await avatarCleanupWorker.processNextJob();

        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'failed');
        assert.equal(row?.attempts, 5);

        assert.equal(errors.length, 1);
        const meta = errors[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_EXHAUSTED');
        assert.equal(meta.publicId, job.publicId);
        assert.equal(meta.userId, job.userId);
    });

    it('never deletes an asset the owner profile references again', async () => {
        const userId = String(newUserId());
        const queuedId = publicId('worker-referenced');
        await createProfile({ userId, avatarUrl: assetUrl(queuedId) });
        const job = await seedJob({ publicId: queuedId, userId });

        const warnings: unknown[][] = [];
        mock.method(workerLogger, 'warn', (...args: unknown[]) => {
            warnings.push(args);
            return workerLogger;
        });

        await avatarCleanupWorker.processNextJob();

        assert.deepEqual(destroyCalls, []);

        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'done');

        assert.equal(warnings.length, 1);
        const meta = warnings[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_SKIPPED');
        assert.equal(meta.reason, 'currently_referenced');
    });

    it('refuses to destroy public ids outside the configured folder', async () => {
        const job = await seedJob({ publicId: 'someone-else/asset' });

        const warnings: unknown[][] = [];
        mock.method(workerLogger, 'warn', (...args: unknown[]) => {
            warnings.push(args);
            return workerLogger;
        });

        await avatarCleanupWorker.processNextJob();

        assert.deepEqual(destroyCalls, []);

        const row = await AvatarCleanupOutboxModel.findById(job._id).lean();
        assert.equal(row?.status, 'done');

        assert.equal(warnings.length, 1);
        const meta = warnings[0]![1] as Record<string, unknown>;
        assert.equal(meta.event, 'CLOUDINARY_AVATAR_CLEANUP_SKIPPED');
        assert.equal(meta.reason, 'public_id_not_owned');
    });

    it('does not force a retry for a job that just failed (backoff respected)', async () => {
        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };
        await seedJob();

        await avatarCleanupWorker.processNextJob();
        destroyCalls = [];

        const processed = await avatarCleanupWorker.processNextJob();

        assert.equal(processed, false);
        assert.deepEqual(destroyCalls, []);
    });

    it('does nothing when no job is due', async () => {
        await seedJob({ nextAttemptAt: new Date(Date.now() + 60_000) });

        const processed = await avatarCleanupWorker.processNextJob();

        assert.equal(processed, false);
        assert.deepEqual(destroyCalls, []);
    });

    it('recovers processing jobs whose lease expired', async () => {
        const stale = new Date(Date.now() - 6 * 60_000);
        const retryable = await seedJob({
            status: 'processing',
            attempts: 1,
            lockedAt: stale,
            lockedBy: 'dead-worker',
        });
        const exhausted = await seedJob({
            publicId: publicId('stale-exhausted'),
            status: 'processing',
            attempts: 5,
            lockedAt: stale,
            lockedBy: 'dead-worker',
        });

        const released = await avatarCleanupOutboxService.releaseStaleJobs();

        assert.equal(released, 2);

        const retryableRow = await AvatarCleanupOutboxModel.findById(
            retryable._id
        ).lean();
        assert.equal(retryableRow?.status, 'pending');
        assert.equal(retryableRow?.lockedAt, null);
        assert.ok(
            (retryableRow?.nextAttemptAt.getTime() ?? Infinity) <= Date.now()
        );

        const exhaustedRow = await AvatarCleanupOutboxModel.findById(
            exhausted._id
        ).lean();
        assert.equal(exhaustedRow?.status, 'failed');
    });

    it('does not release jobs whose lease is still alive', async () => {
        const active = await seedJob({
            status: 'processing',
            attempts: 1,
            lockedAt: new Date(),
            lockedBy: 'active-worker',
        });

        const released = await avatarCleanupOutboxService.releaseStaleJobs();

        assert.equal(released, 0);

        const row = await AvatarCleanupOutboxModel.findById(active._id).lean();
        assert.equal(row?.status, 'processing');
        assert.equal(row?.lockedBy, 'active-worker');
    });

    it('does not delete an old asset after the user swapped back to it', async () => {
        const userId = String(newUserId());
        const idA = publicId('swap-a');
        const idB = publicId('swap-b');
        await createProfile({ userId, avatarUrl: assetUrl(idA) });

        // A -> B: deleting A fails inline, so a background retry is queued.
        destroyImpl = async () => {
            throw new Error('cloudinary unreachable');
        };
        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(idB),
        });

        // B -> A: the profile references A again; deleting B succeeds.
        destroyImpl = async () => ({ result: 'ok' });
        await AuthServiceBoot.updateProfileService(userId, {
            avatarUrl: assetUrl(idA),
        });

        assert.deepEqual(destroyCalls, [idA, idB]);

        // The queued retry for A must not delete the now-current avatar.
        const processed = await avatarCleanupWorker.processNextJob();

        assert.equal(processed, true);
        assert.deepEqual(destroyCalls, [idA, idB]);

        const job = await AvatarCleanupOutboxModel.findOne({
            publicId: idA,
        }).lean();
        assert.equal(job?.status, 'done');

        const profile = await ProfileModel.findOne({ userId }).lean();
        assert.equal(profile?.avatarUrl, assetUrl(idA));
    });
});
