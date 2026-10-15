import mongoose from 'mongoose';
import { Section } from '@paperwork/types';
import { AppError } from '@/utils/AppError';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';

interface I {
    userId: string;
    formId: string;
    sectionId: string;
}

class SectionService {
    private async authorizeForm(
        formId: string,
        userId: string,
        session?: mongoose.ClientSession
    ) {
        const formDocument = await FormsModel.findOne({
            _id: formId,
            userId,
        }).session(session || null);
        const form = formDocument?.toJSON();
        if (!form) {
            throw AppError.Unauthorized('Form not found or access denied');
        }
        return form;
    }

    async create(userId: string, formId: string, data: Section) {
        await this.authorizeForm(formId, userId);
        const sectionCount = await SectionModel.countDocuments({ formId });

        const createdSection = await SectionModel.create({
            formId,
            ...data,
            index: sectionCount,
        });

        return createdSection.toJSON();
    }

    async delete(ids: I) {
        const { formId, sectionId, userId } = ids;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await this.authorizeForm(formId, userId, session);

            const deletedSection = await SectionModel.findOneAndDelete(
                { _id: sectionId, formId },
                { session }
            );

            if (!deletedSection)
                throw AppError.SectionNotFound('Section not found');

            await Promise.all([
                QuestionsModel.deleteMany({ sectionId }, { session }),
                SectionModel.updateMany(
                    { formId, index: { $gt: deletedSection.index } },
                    { $inc: { index: -1 } },
                    { session }
                ),
            ]);

            await session.commitTransaction();
            return deletedSection.toJSON();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async update(ids: I, data: Partial<Section>) {
        const { sectionId, formId, userId } = ids;
        await this.authorizeForm(formId, userId);

        const updatedSection = await SectionModel.findByIdAndUpdate(
            sectionId,
            data,
            { returnDocument: 'after', runValidators: true }
        );
        if (!updatedSection) {
            throw AppError.SectionNotFound('Section not found');
        }
        return updatedSection.toJSON();
    }

    async get(formId: string, userId: string) {
        await this.authorizeForm(formId, userId);
        const sections = await SectionModel.find({ formId }).sort({ index: 1 });
        return sections.map((section) => section.toJSON());
    }

    async getById(ids: I) {
        const { sectionId, formId, userId } = ids;
        await this.authorizeForm(formId, userId);

        const section = await SectionModel.findOne({
            _id: sectionId,
            formId,
        });
        if (!section) {
            throw AppError.SectionNotFound('Section not found');
        }

        return section.toJSON();
    }

    async reorder(
        ids: Omit<I, 'sectionId'>,
        data: { sectionId: string; index: number }[]
    ) {
        const { formId, userId } = ids;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await this.authorizeForm(formId, userId, session);

            const operations = [
                ...data.map(({ sectionId, index }) => ({
                    updateOne: {
                        filter: { _id: sectionId, formId },
                        update: { $set: { index: -(index + 1) } },
                    },
                })),
                ...data.map(({ sectionId, index }) => ({
                    updateOne: {
                        filter: { _id: sectionId, formId },
                        update: { $set: { index } },
                    },
                })),
            ];

            await SectionModel.bulkWrite(operations, { session });
            await session.commitTransaction();

            const sections = await SectionModel.find({ formId }).sort({
                index: 1,
            });
            return sections.map((section) => section.toJSON());
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default SectionService;
