import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import UserModel from '@/modules/auth/schemas/user.schema';
import { FormCore, FormEntity, GetAllOptions } from '@/types/form/forms';
import { emailQueue } from '@/queues';
import fieldsValidator from '../validators/validator.feilds';
import { formIndexCache } from '@/redis/formIndex';

class FormsService {
    async create(data: FormCore, userId: string) {
        const { settings, ...rest } = data;
        const safeSettings = settings ?? {};
        const form = await FormsModel.create({
            ...rest,
            settings: safeSettings,
            userId,
        });
        if (!form) {
            throw AppError.FormCreationFailed('Failed to create form');
        }

        // The cached id/name index no longer matches this user's forms.
        await formIndexCache.invalidate(userId);

        // Fetch user email for notification
        const user = await UserModel.findById(userId).select('email');
        if (user?.email) {
            await emailQueue.add(
                'sendFormCreatedEmail',
                {
                    formId: form._id.toString(),
                    formName: form.name,
                    email: user.email,
                },
                {
                    attempts: 10,
                    backoff: { type: 'exponential', delay: 60 * 1000 },
                }
            );
        }

        return form.toObject();
    }

    /**
     * Name search across the signed-in user's forms.
     *
     * Only `_id` and `name` are projected - enough to render a result row and
     * fetch the form later, without pulling whole documents into a typeahead.
     */
    /**
     * Name search across the signed-in user's forms.
     *
     * Only `{_id, name}` is needed, so the whole per-user index is cached (see
     * `formIndexCache`) and the filter runs in memory. That removes the regex
     * against Mongo and makes a `name` index unnecessary at ordinary volumes,
     * while keeping substring matching.
     */
    async search(userId: string, q: string, limit: number = 10) {
        const term = q.trim().toLowerCase();

        if (!term) return [];

        const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 10), 25);

        const index = await formIndexCache.getOrLoad(userId, () =>
            FormsModel.find({ userId })
                .select('_id name')
                .sort({ updatedAt: -1 })
                .lean()
                .then((rows) =>
                    rows.map((row) => ({
                        _id: String(row._id),
                        name: row.name ?? '',
                    }))
                )
        );

        return (
            index
                .filter((entry: { _id: string; name: string }) =>
                    entry.name.toLowerCase().includes(term)
                )
                // The index is already newest-first from the loader, so filtering
                // preserves that ordering.
                .slice(0, safeLimit)
        );
    }

    /**
     * A single form with its body.
     *
     * Sections and questions are returned flat, matching the shape the bulk
     * endpoint accepts, so a client can hydrate its local cache in one request
     * instead of fanning out over the section and question routers.
     */
    async get(formId: string, userId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId })
            .select('-__v')
            .lean();
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        const [sections, questions] = await Promise.all([
            SectionModel.find({ formId }).sort({ index: 1 }).lean(),
            QuestionsModel.find({ formId }).sort({ index: 1 }).lean(),
        ]);

        return { form, sections, questions };
    }

    async delete(formId: string, userId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const form = await FormsModel.findOneAndDelete(
                { _id: formId, userId },
                { session }
            );

            if (!form) {
                throw AppError.FormNotFound('Form not found');
            }

            await Promise.all([
                SectionModel.deleteMany({ formId }, { session }),
                QuestionsModel.deleteMany({ formId }, { session }),
            ]);

            await session.commitTransaction();

            // The form is gone, so the cached id/name index is stale.
            await formIndexCache.invalidate(userId);
        } catch (error) {
            await session.abortTransaction();

            if (error instanceof AppError) throw error;
            throw AppError.FormDeletionFailed(
                'Failed to delete form and its components'
            );
        } finally {
            await session.endSession();
        }
    }

    async put(updateData: FormCore, userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) throw AppError.FormNotFound('Form not found');

        if (Object.keys(updateData).length === 0)
            throw AppError.BadRequest('No update data provided');

        form.set(fieldsValidator.getSafeFormData(updateData));
        await form.save();

        if (updateData.name !== undefined) {
            await formIndexCache.invalidate(userId);
        }

        return form.toObject();
    }

    async bulkPut(updateData: FormEntity, userId: string, formId: string) {
        const { sections = [], questions = [], ...rest } = updateData;

        const safeFormData = fieldsValidator.getSafeFormData(rest);

        const safeSections = sections.map((section) => ({
            _id: section._id,
            formId,
            ...fieldsValidator.getSafeSectionData(section),
        }));

        const safeQuestions = questions.map((question) => ({
            _id: question._id,
            formId,
            // `getSafeQuestionData` only picks schema-owned content fields, so
            // the section link has to be re-attached here or it is lost.
            sectionId: question.sectionId,
            ...fieldsValidator.getSafeQuestionData(question),
        }));

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const form = await FormsModel.findOneAndUpdate(
                    { _id: formId, userId },
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
            if (error instanceof AppError) throw error;
            throw AppError.Internal('Failed to update form and its components');
        } finally {
            await session.endSession();
        }
    }

    async patch(updateData: Partial<FormCore>, userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });

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

        return form.toObject();
    }

    /**
     * Flips isPublished/isPrivate.
     *
     * No cache invalidation here: the id/name index only holds `_id` and `name`,
     * and neither changes here. The 5 minute Redis TTL is the safety net.
     */
    private async toggleBoolean(
        userId: string,
        formId: string,
        field: 'isPublished' | 'isPrivate',
        bool: boolean
    ) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        if (form[field] === bool) {
            throw AppError.FormPublishFailed(
                `Form is already ${bool ? 'published' : 'unpublished'}`
            );
        }

        form[field] = bool;

        try {
            await form.save();
        } catch (error) {
            throw AppError.FormPublishFailed('Failed to publish form');
        }

        return form.toObject();
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
            }).session(session);
            if (!form) {
                throw AppError.FormNotFound('Form not found');
            }

            const { _id, ...cleanForm } = form.toObject();

            const [duplicatedForm] = await FormsModel.create(
                [
                    {
                        ...cleanForm,
                        name: `${cleanForm.name} (Copy)`,
                        isPublished: false,
                        userId,
                    },
                ],
                { session }
            );

            if (!duplicatedForm) {
                throw AppError.FormCreationFailed('Failed to duplicate form');
            }

            const newFormId = duplicatedForm._id.toString();

            const [sections, questions] = await Promise.all([
                SectionModel.find({ formId }).lean(),
                QuestionsModel.find({ formId }).lean(),
            ]);

            const sectionIdMap = new Map<string, string>();

            if (sections.length) {
                const newSections = await SectionModel.insertMany(
                    sections.map(({ _id, ...section }) => ({
                        ...section,
                        formId: newFormId,
                    })),
                    { session }
                );

                newSections.forEach((newSection, i) => {
                    if (sections[i]) {
                        sectionIdMap.set(
                            sections[i]._id.toString(),
                            newSection._id.toString()
                        );
                    }
                });
            }

            if (questions.length) {
                await QuestionsModel.insertMany(
                    questions.map(({ _id, ...question }) => ({
                        ...question,
                        formId: newFormId,
                        sectionId: sectionIdMap.get(
                            question.sectionId.toString()
                        ),
                    })),
                    { session }
                );
            }

            await session.commitTransaction();

            // A new form was added to this user's index.
            await formIndexCache.invalidate(userId);
            return duplicatedForm.toObject();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getAll(userId: string, options: GetAllOptions) {
        const { limit, page, lastUpdated } = options;
        const skip = (page - 1) * limit;

        const query: Record<string, any> = { userId };
        if (lastUpdated) {
            query.updatedAt = { $gt: lastUpdated };
        }
        const forms = await FormsModel.find(query)
            .select(
                // Must match formsSchema - `title`/`description` are not
                // fields, so selecting them silently dropped `name`.
                'name isPublished isPrivate allowedDomains settings theme createdAt updatedAt __v'
            )
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return forms;
    }
}

export default FormsService;
