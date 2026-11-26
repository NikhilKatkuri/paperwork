import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import PendingDeleteModel from '@/modules/forms/schemas/schemas.pendingDelete';
import UserModel from '@/modules/auth/schemas/user.schema';
import {
    CreateFormDoc,
    FORM_BIN_RETENTION_DAYS,
    Form,
    FormDoc,
    FormDto,
    PaginationOptions,
    SectionDoc,
} from '@paperwork/types';
import fieldsValidator from '../validators/validator.feilds';
import { formIndexCache } from '@/cache/formIndex';
import { logger, logError } from '@/utils/logger';
import { EmailPriority } from '@/modules/email/types/emailOutbox.type';
import emailOutboxService from '@/modules/email/services/emailOutbox.service';
import { generateShareCode, isDuplicateKeyError } from '@/utils/shareCode';

/**
 * Only forms without a `deletedAt` are visible to the normal form routes.
 * Trashed forms are reachable exclusively through the bin endpoints so an
 * expired session or a stale client cannot edit a form awaiting purge.
 */
const ACTIVE = { deletedAt: { $exists: false } };
const TRASHED = { deletedAt: { $exists: true } };

class FormsService {
    /**
     * @description Create a new form for a user.
     * @param props: @Form
     * @returns @Form
     */

    async create(props: CreateFormDoc, userId: string): Promise<FormDto> {
        // Never trust client-supplied ownership/counters.
        const { settings, section: s, questions, ...rest } = props as any;
        const {
            responseCount: _rc,
            isPublished: _pub,
            userId: _uid,
            ...data
        } = rest ?? {};

        const session = await mongoose.startSession();
        let form: any;
        let section: any;
        let createdQuestions: any[] = [];
        try {
            await session.withTransaction(async () => {
                const created = await FormsModel.create(
                    [
                        {
                            ...fieldsValidator.getSafeFormData(data),
                            userId,
                            settings: settings ?? {},
                            isPublished: false,
                            responseCount: 0,
                        },
                    ],
                    { session }
                );
                form = created[0];
                if (!form)
                    throw AppError.FormCreationFailed('Failed to create form');

                const sectionDocs = await SectionModel.create(
                    [
                        {
                            ...fieldsValidator.getSafeSectionData(s ?? {}),
                            formId: form._id,
                        },
                    ],
                    { session }
                );
                section = sectionDocs[0];
                if (!section)
                    throw AppError.SectionCreationFailed(
                        'Failed to create default section'
                    );

                if (questions?.length) {
                    createdQuestions = await QuestionsModel.create(
                        questions.map((q: any) => ({
                            ...fieldsValidator.getSafeQuestionData(q),
                            formId: form._id,
                            sectionId: section._id,
                        })),
                        { session }
                    );
                }
            });

            const formObj = form.toJSON() as unknown as FormDoc;
            const sectionObj = section.toJSON() as unknown as SectionDoc;

            await formIndexCache.invalidate(userId).catch(() => undefined);

            const formIdForMail = (formObj as any).id ?? String(form._id);
            const user = await UserModel.findById(userId).select('email');

            if (user?.email) {
                await emailOutboxService.addEmailToOutbox({
                    type: 'sendFormCreatedEmail',
                    payload: {
                        formId: formIdForMail,
                        formName: (formObj as any).name,
                        email: user.email,
                    },
                    priority: EmailPriority.FORM_CREATED,
                });
            }

            const { formId: _sectionFormId, ...sectionData } = sectionObj;

            return {
                ...formObj,
                sections: [sectionData],
                questions: createdQuestions.map((question) => {
                    const { formId: _questionFormId, ...questionData } =
                        question.toJSON();

                    return questionData;
                }),
            } as unknown as FormDto;
        } catch (error) {
            // Never mask the cause: the generic message reaches the client,
            // but the real error (validation, duplicate key, transaction)
            // must be in the logs or failures are untraceable.
            if (!(error instanceof AppError)) {
                logError(logger, 'form.create_failed', error, {
                    event: 'FORM_CREATE_FAILED',
                    userId,
                });
            }
            if (error instanceof AppError) throw error;
            throw AppError.FormCreationFailed('Failed to create form');
        } finally {
            await session.endSession();
        }
    }

    /**
     * @description Returns a form with its sections and questions, all in one object. The sections and questions are sorted by their `index` field.
     * @param formId
     * @param userId
     * @returns @formDto
     */

    async get(formId: string, userId: string): Promise<FormDto> {
        const [form, sections, questions] = await Promise.all([
            FormsModel.findOne({ _id: formId, userId, ...ACTIVE }),
            SectionModel.find({ formId }).sort({ index: 1 }),
            QuestionsModel.find({ formId }).sort({ index: 1 }),
        ]);

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        // NOTE: never object-spread a Mongoose document (`{...doc}` yields
        // internal `$__`/`_doc` fields, not the data — this previously
        // shipped garbage sections/questions that crashed the editor).
        // `toJSON()` applies the transform (`_id` → `id`, dates → ISO).
        const { formId: _formId, ...formData } = form.toJSON() as any;
        return {
            ...formData,
            sections: sections.map((section) => {
                const { formId: _sFormId, ...rest } = section.toJSON() as any;
                return rest;
            }),
            questions: questions.map((question) => {
                const { formId: _qFormId, ...rest } = question.toJSON() as any;
                return rest;
            }),
        } as unknown as FormDto;
    }

    async ensureShareCode(userId: string, formId: string): Promise<string> {
        const form = await FormsModel.findOne({
            _id: formId,
            userId,
            ...ACTIVE,
        })
            .select('shareCode')
            .lean();
        if (!form) throw AppError.FormNotFound('Form not found');
        if (form.shareCode) return form.shareCode;

        for (let attempt = 0; attempt < 3; attempt++) {
            const code = generateShareCode();
            try {
                const updated = await FormsModel.findOneAndUpdate(
                    {
                        _id: formId,
                        userId,
                        ...ACTIVE,
                        shareCode: { $exists: false },
                    },
                    { $set: { shareCode: code } },
                    { new: true }
                )
                    .select('shareCode')
                    .lean();

                if (updated?.shareCode) return updated.shareCode;

                const raced = await FormsModel.findOne({
                    _id: formId,
                    userId,
                    ...ACTIVE,
                })
                    .select('shareCode')
                    .lean();
                if (raced?.shareCode) return raced.shareCode;
            } catch (error) {
                if (!isDuplicateKeyError(error) || attempt === 2) throw error;
            }
        }

        throw AppError.FormCreationFailed('Failed to create share link');
    }

    async resolveShareCode(code: string): Promise<string> {
        const form = await FormsModel.findOne({
            shareCode: code,
            isPublished: true,
            ...ACTIVE,
        })
            .select('_id')
            .lean();
        if (!form) throw AppError.FormNotFound('Share link not found');
        return form._id.toString();
    }

    /**
     * @description Search for forms by name.
     * @param userId
     * @param q search query
     * @param limit number of results to return, default 10
     * @returns a list of forms matching the search query, or an empty list if no matches are found.
     */
    async search(
        userId: string,
        q: string,
        limit: number = 10
    ): Promise<{ _id: string; name: string }[]> {
        const term = q.trim().toLowerCase();

        if (!term) return [];

        const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 10), 25);

        const index = await formIndexCache.getOrLoad(userId, async () => {
            // Use .lean() to get plain objects directly for optimal performance
            const forms = await FormsModel.find({ userId, ...ACTIVE })
                .select('_id name')
                .sort({ updatedAt: -1 })
                .lean();

            return forms.map((form: any) => ({
                _id: String(form._id),
                name: form.name ?? '',
            }));
        });

        return index
            .filter((entry: { _id: string; name: string }) =>
                entry.name.toLowerCase().includes(term)
            )
            .slice(0, safeLimit);
    }

    /**
     * Default delete semantics: mark the form as trashed instead of removing
     * it. Sections/questions are intentionally kept so a restore is lossless.
     * Idempotent — a repeated delete leaves the original bin timestamp alone.
     */
    async moveToBin(formId: string, userId: string): Promise<FormDoc> {
        const form = await FormsModel.findOne({ _id: formId, userId });

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        // A repeated delete must not push the purge deadline further out.
        if (!form.deletedAt) {
            form.deletedAt = new Date();
            await form.save();
            await formIndexCache.invalidate(userId).catch(() => undefined);
        }

        return form.toJSON() as unknown as FormDoc;
    }

    /** Bring a trashed form back. A no-op on a form that is not in the bin. */
    async restoreFromBin(formId: string, userId: string): Promise<FormDoc> {
        // `$unset` removes the key outright, so later `deletedAt` filters are
        // unambiguous. Applying it to an already-active form is harmless.
        const form = await FormsModel.findOneAndUpdate(
            { _id: formId, userId },
            { $unset: { deletedAt: 1 } },
            { new: true }
        );

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        await formIndexCache.invalidate(userId).catch(() => undefined);

        return form.toJSON() as unknown as FormDoc;
    }

    async listBin(
        userId: string,
        options: Pick<PaginationOptions, 'page' | 'limit'>
    ): Promise<Form[]> {
        const pending = await PendingDeleteModel.find({ userId })
            .select('formId')
            .lean();
        const pendingIds = pending.map((row) => row.formId);

        const filter = {
            userId,
            ...TRASHED,
            ...(pendingIds.length && { _id: { $nin: pendingIds } }),
        };

        const forms = await FormsModel.find(filter)
            .sort({ deletedAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        return forms.map((form) => form.toJSON() as unknown as Form);
    }

    async deletePermanent(formId: string, userId: string): Promise<void> {
        const form = await FormsModel.findOne({ _id: formId, userId, ...TRASHED });
        if (!form) throw AppError.FormNotFound('Form not found');

        await this.enqueuePermanentDelete(userId, [formId]);
    }

    async emptyBin(userId: string): Promise<number> {
        const forms = await FormsModel.find({ userId, ...TRASHED })
            .select('_id')
            .lean();
        const ids = forms.map((form) => String(form._id));

        if (!ids.length) return 0;

        await this.enqueuePermanentDelete(userId, ids);

        return ids.length;
    }

    private async enqueuePermanentDelete(
        userId: string,
        formIds: string[]
    ): Promise<number> {
        if (!formIds.length) return 0;

        let queued = formIds.length;

        try {
            const result = await PendingDeleteModel.bulkWrite(
                formIds.map((formId) => ({
                    updateOne: {
                        filter: { userId, formId },
                        update: { $setOnInsert: { userId, formId } },
                        upsert: true,
                    },
                })),
                { ordered: false }
            );
            queued = result.upsertedCount ?? formIds.length;
        } catch (error) {
            if ((error as { code?: number }).code !== 11000) throw error;
        }

        await formIndexCache.invalidate(userId).catch(() => undefined);

        return queued;
    }

    async performPendingDeletes(batchSize: number = 200): Promise<number> {
        const jobs = await PendingDeleteModel.find()
            .sort({ createdAt: 1 })
            .limit(batchSize)
            .lean();

        if (!jobs.length) return 0;

        const byUser = new Map<string, string[]>();
        const jobIdsByUser = new Map<string, string[]>();

        jobs.forEach((job) => {
            const userId = String(job.userId);
            const formIds = byUser.get(userId) ?? [];
            formIds.push(String(job.formId));
            byUser.set(userId, formIds);

            const jobIds = jobIdsByUser.get(userId) ?? [];
            jobIds.push(String(job._id));
            jobIdsByUser.set(userId, jobIds);
        });

        let removed = 0;

        for (const [userId, formIds] of byUser) {
            try {
                await this.hardDeleteForms(formIds);
                await PendingDeleteModel.deleteMany({
                    _id: { $in: jobIdsByUser.get(userId) ?? [] },
                });
                await formIndexCache.invalidate(userId).catch(() => undefined);
                removed += formIds.length;
            } catch (error) {
                logError(logger, 'form.pending_delete_slot_failed', error, {
                    event: 'FORM_PENDING_DELETE_SLOT_FAILED',
                    userId,
                    formCount: formIds.length,
                });
            }
        }

        return removed;
    }

    /**
     * Retention sweep used by the background worker. Removes forms left in
     * the bin longer than FORM_BIN_RETENTION_DAYS. Returns the purged count.
     */
    async purgeExpired(
        retentionDays: number = FORM_BIN_RETENTION_DAYS
    ): Promise<number> {
        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const forms = await FormsModel.find({
            ...TRASHED,
            deletedAt: { $lte: cutoff },
        })
            .select('_id userId')
            .lean();

        if (!forms.length) return 0;

        const ids = forms.map((form) => String(form._id));
        await this.hardDeleteForms(ids);

        const userIds = new Set(forms.map((form) => String(form.userId)));
        await Promise.all(
            [...userIds].map((id) =>
                formIndexCache.invalidate(id).catch(() => undefined)
            )
        );

        return ids.length;
    }

    private async hardDeleteForms(formIds: string[]): Promise<void> {
        if (!formIds.length) return;

        const deleteAll = async (session?: mongoose.ClientSession) => {
            const options = session ? { session } : {};

            // Children first: if the non-transactional fallback fails halfway
            // through, the form itself survives and the user can retry.
            await SectionModel.deleteMany(
                { formId: { $in: formIds } },
                options
            );
            await QuestionsModel.deleteMany(
                { formId: { $in: formIds } },
                options
            );
            await FormsModel.deleteMany({ _id: { $in: formIds } }, options);
        };

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(() => deleteAll(session));
            return;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logError(logger, 'form.hard_delete_transaction_failed', error, {
                event: 'FORM_HARD_DELETE_TRANSACTION_FAILED',
                formCount: formIds.length,
            });
        } finally {
            await session.endSession();
        }

        try {
            await deleteAll();
        } catch (error) {
            const reason =
                error instanceof Error ? error.message : String(error);
            logError(logger, 'form.hard_delete_failed', error, {
                event: 'FORM_HARD_DELETE_FAILED',
                formCount: formIds.length,
            });
            throw AppError.FormDeletionFailed(
                `Failed to delete form and its components: ${reason}`
            );
        }
    }

    /**
     * @description Updates a form.
     * @param updateData The data to update the form with.
     * @param userId The ID of the user who owns the form.
     * @param formId The ID of the form to update.
     * @return A promise that resolves to the updated form.
     * @throws AppError.FormNotFound if the form does not exist.
     * @throws AppError.BadRequest if no update data is provided.
     */
    async put(updateData: Form, userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId, ...ACTIVE });
        if (!form) throw AppError.FormNotFound('Form not found');

        if (Object.keys(updateData).length === 0)
            throw AppError.BadRequest('No update data provided');

        form.set(fieldsValidator.getSafeFormData(updateData));

        await form.save();

        if (updateData.name !== undefined) {
            await formIndexCache.invalidate(userId);
        }

        return form.toJSON();
    }

    /**
     * @description Updates a form and its sections and questions in a single transaction.
     * @param updateData The data to update the form with, including sections and questions.
     * @param userId The ID of the user who owns the form.
     * @param formId The ID of the form to update.
     * @return A promise that resolves to the updated form with its sections and questions.
     * @throws AppError.FormNotFound if the form does not exist.
     * @throws AppError.Internal if the update fails for any reason.
     */
    async bulkPut(updateData: FormDto, userId: string, formId: string) {
        const { sections = [], questions = [], ...data } = updateData as any;

        const safeFormData = fieldsValidator.getSafeFormData(data);

        const toObjectId = (v: any) => {
            const raw = v?._id ?? v?.id;
            if (!raw) return new mongoose.Types.ObjectId();
            try {
                return new mongoose.Types.ObjectId(String(raw));
            } catch {
                return new mongoose.Types.ObjectId();
            }
        };

        const safeSections = (sections as any[]).map((section) => {
            const _id = toObjectId(section);
            return {
                _id,
                formId,
                ...fieldsValidator.getSafeSectionData(section),
            };
        });

        const safeQuestions = (questions as any[]).map((question) => {
            const _id = toObjectId(question);
            const safe = fieldsValidator.getSafeQuestionData(question);
            return {
                _id,
                ...safe,
                formId,
                sectionId: (question as any).sectionId,
            };
        });

        /**
         * A question may only point at a section in this same payload.
         * Sections absent from the payload are deleted below, so an
         * unchecked id would either orphan the question or attach it to a
         * section that belongs to a different form.
         */
        const safeSectionIds = new Set(
            safeSections.map((section) => String(section._id))
        );
        if (safeQuestions.length && safeSectionIds.size === 0) {
            throw AppError.BadRequest(
                'Questions must reference a section in the same update'
            );
        }
        for (const question of safeQuestions) {
            if (
                !question.sectionId ||
                !safeSectionIds.has(String(question.sectionId))
            ) {
                throw AppError.BadRequest(
                    'Question references a section outside this form'
                );
            }
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const form = await FormsModel.findOneAndUpdate(
                    { _id: formId, userId, ...ACTIVE },
                    { $set: safeFormData },
                    { new: true, session }
                );

                if (!form) {
                    throw AppError.FormNotFound('Form not found');
                }

                const sectionIds = safeSections.map((s) => s._id);

                await SectionModel.deleteMany(
                    {
                        formId,
                        ...(sectionIds.length && { _id: { $nin: sectionIds } }),
                    },
                    { session }
                );

                if (safeSections.length) {
                    await SectionModel.bulkWrite(
                        safeSections.map((section) => ({
                            updateOne: {
                                filter: { _id: section._id, formId },
                                update: { $set: section },
                                upsert: true,
                            },
                        })),
                        { session }
                    );
                }

                const questionIds = safeQuestions.map((q) => q._id);

                await QuestionsModel.deleteMany(
                    {
                        formId,
                        ...(questionIds.length && {
                            _id: { $nin: questionIds },
                        }),
                    },
                    { session }
                );

                if (safeQuestions.length) {
                    await QuestionsModel.bulkWrite(
                        safeQuestions.map((question) => ({
                            updateOne: {
                                filter: { _id: question._id, formId },
                                update: { $set: question },
                                upsert: true,
                            },
                        })),
                        { session }
                    );
                }
            });

            await formIndexCache.invalidate(userId);

            return await FormsModel.findOne({ _id: formId, userId })
                .select('-__v')
                .lean();
        } catch (error) {
            if (!(error instanceof AppError)) {
                logError(logger, 'form.bulk_update_failed', error, {
                    event: 'FORM_BULK_UPDATE_FAILED',
                    userId,
                    formId,
                });
            }
            if (error instanceof AppError) throw error;
            throw AppError.Internal('Failed to update form and its components');
        } finally {
            await session.endSession();
        }
    }

    /**
     * @description Updates a form.
     * @param updateData The data to update the form with.
     * @param userId The ID of the user who owns the form.
     * @param formId The ID of the form to update.
     * @return A promise that resolves to the updated form.
     * @throws AppError.FormNotFound if the form does not exist.
     * @throws AppError.BadRequest if no update data is provided.
     */
    async patch(
        updateData: Partial<Form>,
        userId: string,
        formId: string
    ): Promise<Form> {
        const form = await FormsModel.findOne({ _id: formId, userId, ...ACTIVE });

        if (!form) throw AppError.FormNotFound('Form not found');

        if (Object.keys(updateData).length === 0)
            throw AppError.BadRequest('No update data provided');

        const filteredUpdate = fieldsValidator.getSafeFormData(updateData);

        if (filteredUpdate.settings) {
            filteredUpdate.settings = {
                ...form.settings,
                ...filteredUpdate.settings,
            };
        }

        form.set(filteredUpdate);
        await form.save();

        if (updateData.name !== undefined) {
            await formIndexCache.invalidate(userId);
        }

        return form.toJSON() as unknown as Form;
    }

    /**
     * Flips isPublished/isPrivate.
     *
     * Idempotent: requesting the state the form is already in returns the
     * form instead of throwing. The editor cannot always know the server
     * state (stale local cache), and a 409 there surfaces as a confusing
     * "already published" error for an action the user considers valid.
     *
     * No cache invalidation here: the id/name index only holds `_id` and `name`,
     * and neither changes here. The short TTL on the in-memory index is the
     * safety net.
     */
    private async toggleBoolean(
        userId: string,
        formId: string,
        field: 'isPublished' | 'isPrivate',
        bool: boolean
    ) {
        const form = await FormsModel.findOne({ _id: formId, userId, ...ACTIVE });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        if (form[field] === bool) {
            return form.toJSON();
        }

        form[field] = bool;

        try {
            await form.save();
        } catch (error) {
            throw AppError.FormPublishFailed('Failed to publish form');
        }

        return form.toJSON();
    }

    async publish(userId: string, formId: string) {
        return this.toggleBoolean(userId, formId, 'isPublished', true);
    }

    async unPublish(userId: string, formId: string) {
        return this.toggleBoolean(userId, formId, 'isPublished', false);
    }

    async duplicate(userId: string, formId: string) {
        const session = await mongoose.startSession();

        session.startTransaction();

        try {
            const form = await FormsModel.findOne({
                _id: formId,
                userId,
                ...ACTIVE,
            }).session(session);
            if (!form) {
                throw AppError.FormNotFound('Form not found');
            }

            const { _id, ...cleanForm } = form.toJSON() as any;
            const {
                responseCount: _dupRc,
                id: _dupId,
                v: _dupV,
                shareCode: _shareCode,
                ...baseForm
            } = cleanForm;

            const [duplicatedForm] = await FormsModel.create(
                [
                    {
                        ...baseForm,
                        name: `${cleanForm.name} (Copy)`,
                        isPublished: false,
                        responseCount: 0,
                        userId,
                    },
                ],
                { session }
            );

            if (!duplicatedForm) {
                throw AppError.FormCreationFailed('Failed to duplicate form');
            }

            const newFormId = duplicatedForm._id.toHexString();

            const [sections, questions] = await Promise.all([
                SectionModel.find({ formId }).session(session).lean(),
                QuestionsModel.find({ formId }).session(session).lean(),
            ]);

            const sectionIdMap = new Map<string, string>();

            if (sections.length) {
                const newSections = await SectionModel.insertMany(
                    sections.map(
                        ({
                            _id,
                            createdAt,
                            updatedAt,
                            __v,
                            ...section
                        }: any) => ({
                            ...section,
                            formId: newFormId,
                        })
                    ),
                    { session }
                );

                newSections.forEach((newSection, i) => {
                    if (sections[i]) {
                        sectionIdMap.set(
                            sections[i]._id.toHexString(),
                            newSection._id.toHexString()
                        );
                    }
                });
            }

            if (questions.length) {
                const mapped = questions.map(
                    ({ _id, createdAt, updatedAt, __v, ...question }: any) => {
                        const mappedSectionId = sectionIdMap.get(
                            question.sectionId?.toString()
                        );
                        if (!mappedSectionId) {
                            throw AppError.Internal(
                                'Failed to duplicate form: section mapping missing'
                            );
                        }
                        return {
                            ...question,
                            formId: newFormId,
                            sectionId: mappedSectionId,
                        };
                    }
                );
                await QuestionsModel.insertMany(mapped, { session });
            }

            await session.commitTransaction();

            await formIndexCache.invalidate(userId);
            return duplicatedForm.toJSON();
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof AppError) throw error;
            throw AppError.Internal('Failed to duplicate form');
        } finally {
            await session.endSession();
        }
    }

    /**
     * @description Retrieves all forms for a user with pagination and optional filtering by last updated date.
     * @param userId The ID of the user whose forms are to be retrieved.
     * @param options Pagination options including `limit`, `page`, and optional `lastUpdated` date for filtering.
     * @returns A promise that resolves to an array of FormDto objects.
     */
    async getAll(userId: string, options: PaginationOptions): Promise<Form[]> {
        const { limit, page, lastUpdated } = options;
        const skip = (page - 1) * limit;

        const query: Record<string, any> = { userId, ...ACTIVE };
        if (lastUpdated) {
            query.updatedAt = { $gt: lastUpdated };
        }

        const forms = await FormsModel.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        return forms.map((form) => form.toJSON() as unknown as Form);
    }
}

export default FormsService;
