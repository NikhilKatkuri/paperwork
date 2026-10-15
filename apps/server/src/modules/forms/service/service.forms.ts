import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import UserModel from '@/modules/auth/schemas/user.schema';
import {
    Form,
    FormDto,
    FormEntity,
    FormEntityDto,
    PaginationOptions,
    QuestionDto,
    SectionDto,
} from '@paperwork/types';
import { emailQueue } from '@/queues';
import fieldsValidator from '../validators/validator.feilds';
import { formIndexCache } from '@/redis/formIndex';
import { FormDocument } from '@/types';

class FormsService {
    /**
     * @description Create a new form for a user.
     * @param data: @Form
     * @returns @Form
     */

    async create(data: Form): Promise<FormEntityDto> {
        const { settings, userId, ...rest } = data;
        const safeSettings = settings ?? {};

        const form: FormDocument = await FormsModel.create({
            ...rest,
            userId,
            settings: safeSettings,
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
                    formId: form.toObject()._id,
                    formName: form.name,
                    email: user.email,
                },
                {
                    attempts: 10,
                    backoff: { type: 'exponential', delay: 60 * 1000 },
                }
            );
        }

        return form.toObject() satisfies FormEntityDto;
    }

    /**
     * @description Returns a form with its sections and questions, all in one object. The sections and questions are sorted by their `index` field.
     * @param formId
     * @param userId
     * @returns @formDto
     */

    async get(formId: string, userId: string): Promise<FormDto> {
        const [form, sections, questions] = await Promise.all([
            FormsModel.findOne({ _id: formId, userId }),
            SectionModel.find({ formId }).sort({ index: 1 }),
            QuestionsModel.find({ formId }).sort({ index: 1 }),
        ]);

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        return {
            ...(form.toObject() as unknown as FormDto),
            sections: sections.map(
                (s) => s.toObject() as unknown as SectionDto
            ),
            questions: questions.map(
                (q) => q.toObject() as unknown as QuestionDto
            ),
        };
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
            const forms = await FormsModel.find({ userId })
                .select('_id name')
                .sort({ updatedAt: -1 })
                .lean();

            return forms.map((form) => ({
                _id: String(form.toObject()._id),
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
     * @description Deletes a form and all its sections and questions in a single transaction.
     * - If the form does not exist, throws a FormNotFound error.
     * - If the deletion fails, throws a FormDeletionFailed error.
     * - Invalidates the form index cache for the user after successful deletion.
     * @param formId
     * @param userId
     * @return void
     * @throws AppError.FormNotFound if the form does not exist.
     * @throws AppError.FormDeletionFailed if the deletion fails.
     * @throws AppError.Internal for any other unexpected errors.
     */
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
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) throw AppError.FormNotFound('Form not found');

        if (Object.keys(updateData).length === 0)
            throw AppError.BadRequest('No update data provided');

        form.set(fieldsValidator.getSafeFormData(updateData));
        form.__v = form.__v + 1;

        await form.save();

        if (updateData.name !== undefined) {
            await formIndexCache.invalidate(userId);
        }

        return form.toObject();
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
        const { sections = [], questions = [], ...rest } = updateData;

        const safeFormData = fieldsValidator.getSafeFormData(rest);

        const safeSections = sections.map((section) => ({
            _id: section.id,
            formId,
            ...fieldsValidator.getSafeSectionData(section),
        }));

        const safeQuestions = questions.map((question) => ({
            _id: question.id,
            ...fieldsValidator.getSafeQuestionData(question),
            formId,
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
    ): Promise<FormEntity> {
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
        form.__v = form.__v + 1;
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

            const newFormId = duplicatedForm._id.toHexString();

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
                            sections[i]._id.toHexString(),
                            newSection._id.toHexString()
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

            await formIndexCache.invalidate(userId);
            return duplicatedForm.toObject();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * @description Retrieves all forms for a user with pagination and optional filtering by last updated date.
     * @param userId The ID of the user whose forms are to be retrieved.
     * @param options Pagination options including `limit`, `page`, and optional `lastUpdated` date for filtering.
     * @returns A promise that resolves to an array of FormEntityDto objects.
     */
    async getAll(
        userId: string,
        options: PaginationOptions
    ): Promise<FormEntity[]> {
        const { limit, page, lastUpdated } = options;
        const skip = (page - 1) * limit;

        const query: Record<string, any> = { userId };
        if (lastUpdated) {
            query.updatedAt = { $gt: lastUpdated };
        }

        const forms = await FormsModel.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        return forms.map((form) => form.toObject());
    }
}

export default FormsService;
