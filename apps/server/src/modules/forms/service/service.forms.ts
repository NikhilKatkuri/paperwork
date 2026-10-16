import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import UserModel from '@/modules/auth/schemas/user.schema';
import {
    CreateFormDoc,
    Form,
    FormDoc,
    FormDto,
    PaginationOptions,
    SectionDoc,
} from '@paperwork/types';
import { emailQueue } from '@/queues';
import fieldsValidator from '../validators/validator.feilds';
import { formIndexCache } from '@/redis/formIndex';

class FormsService {
    /**
     * @description Create a new form for a user.
     * @param props: @Form
     * @returns @Form
     */

    async create(props: CreateFormDoc, userId: string): Promise<FormDto> {
        // Never trust client-supplied ownership/counters.
        const { settings, section: s, questions, ...rest } = props as any;
        const { responseCount: _rc, isPublished: _pub, userId: _uid, ...data } =
            rest ?? {};

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
                if (!form) throw AppError.FormCreationFailed('Failed to create form');

                const sectionDocs = await SectionModel.create(
                    [{ ...fieldsValidator.getSafeSectionData(s ?? {}), formId: form._id }],
                    { session }
                );
                section = sectionDocs[0];
                if (!section) throw AppError.SectionCreationFailed('Failed to create default section');

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
                emailQueue
                    .add(
                        'sendFormCreatedEmail',
                        {
                            formId: formIdForMail,
                            formName: (formObj as any).name,
                            email: user.email,
                        },
                        {
                            attempts: 10,
                            backoff: {
                                type: 'exponential',
                                delay: 60 * 1000,
                            },
                        }
                    )
                    .catch(() => undefined);
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
            FormsModel.findOne({ _id: formId, userId }),
            SectionModel.find({ formId }).sort({ index: 1 }),
            QuestionsModel.find({ formId }).sort({ index: 1 }),
        ]);

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        return {
            ...form.toJSON(),
            sections: sections.map(({ formId: _formId, ...section }) =>
                section.toJSON ? section.toJSON() : section
            ),
            questions: questions.map(({ formId: _formId, ...question }) =>
                question.toJSON ? question.toJSON() : question
            ),
        } as unknown as FormDto;
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
    ): Promise<Form> {
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

        return form.toJSON();
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
            throw AppError.Conflict(
                `Form is already ${bool ? 'published' : 'unpublished'}`
            );
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
            }).session(session);
            if (!form) {
                throw AppError.FormNotFound('Form not found');
            }

            const { _id, ...cleanForm } = form.toJSON() as any;
            const { responseCount: _dupRc, id: _dupId, v: _dupV, ...baseForm } =
                cleanForm;

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
                    sections.map(({ _id, createdAt, updatedAt, __v, ...section }: any) => ({
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

        const query: Record<string, any> = { userId };
        if (lastUpdated) {
            query.updatedAt = { $gt: lastUpdated };
        }

        const forms = await FormsModel.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        return forms.map((form) => form.toJSON());
    }
}

export default FormsService;
