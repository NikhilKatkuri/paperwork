import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';
import { IformData } from '../types';
import SectionModel from '../schemas/forms.sections';
import QuestionsModel from '../schemas/forms.questions';
import { FormCore } from '@/types/form/forms';
import mongoose from 'mongoose';

class FormsService {
    private allowedSettingsFields = [
        'maxResponses',
        'maxResponsesPerUser',
        'closeDate',
        'startDate',
        'timeLimitPerResponse',
        'collectEmail',
        'shuffleQuestions',
        'allowEditResponse',
        'saveAndContinueLater',
        'progressBar',
        'customConfirmationMessage',
        'redirectUrl',
    ];

    private allowedFormFields = [
        'title',
        'description',
        'isPrivate',
        'isPublished',
        'allowedDomains',
        'settings',
    ];

    private filterSafeFields<T extends Partial<FormCore>>(data: T): T {
        const safeData = {} as T;

        this.allowedFormFields.forEach((field) => {
            const key = field as keyof FormCore;
            const value = data[key];

            if (value === undefined) return;

            if (key === 'settings' && typeof value === 'object') {
                safeData.settings = Object.fromEntries(
                    Object.entries(value).filter(([sKey]) =>
                        this.allowedSettingsFields.includes(sKey)
                    )
                );
            } else {
                (safeData as any)[key] = value;
            }
        });

        return safeData;
    }

    private filterFields(
        data: any,
        allowedFields: string[],
        allowedSettings: string[]
    ) {
        const filtered: any = {};

        for (const key of allowedFields) {
            if (data[key] === undefined) continue;

            if (key === 'settings' && typeof data[key] === 'object') {
                filtered.settings = Object.fromEntries(
                    Object.entries(data[key]).filter(([sKey]) =>
                        allowedSettings.includes(sKey)
                    )
                );
            } else {
                filtered[key] = data[key];
            }
        }
        return filtered;
    }

    async create(data: IformData) {
        const { settings, ...rest } = data;
        const safeSettings = settings ?? {};
        const form = await FormsModel.create({
            ...rest,
            settings: safeSettings,
        });
        if (!form) {
            throw AppError.FormCreationFailed('Failed to create form');
        }

        return form.toObject();
    }

    async get(formId: string, userId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId })
            .select('-__v')
            .lean();
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        return form;
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

        form.set(this.filterSafeFields(updateData));
        await form.save();

        return form.toObject();
    }

    async patch(updateData: Partial<FormCore>, userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });

        if (!form) throw AppError.FormNotFound('Form not found');

        if (Object.keys(updateData).length === 0)
            throw AppError.BadRequest('No update data provided');

        const filteredUpdate = this.filterFields(
            updateData,
            this.allowedFormFields,
            this.allowedSettingsFields
        );

        if (filteredUpdate.settings) {
            filteredUpdate.settings = {
                ...form.settings,
                ...filteredUpdate.settings,
            };
        }

        form.set(filteredUpdate);
        await form.save();
        return form.toObject();
    }

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
                        title: `${cleanForm.title} (Copy)`,
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
            return duplicatedForm.toObject();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async getAll(userId: string) {
        const forms = await FormsModel.find({ userId }).select('-__v').lean();
        if (!forms) {
            throw AppError.FormNotFound('No forms found for this user');
        }
        if (!forms.length) {
            throw AppError.FormNotFound('No forms found for this user');
        }

        return forms;
    }
}

export default FormsService;
