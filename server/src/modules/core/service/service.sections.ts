import mongoose from 'mongoose';
import { SectionCore } from '@/types/form/forms';
import { AppError } from '@/utils/AppError';
import SectionModel from '@/modules/core/schemas/schemas.sections';
import FormsModel from '@/modules/core/schemas/schemas.forms';
import QuestionsModel from '@/modules/core/schemas/schemas.questions';

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
        const form = await FormsModel.findOne({ _id: formId, userId })
            .session(session || null)
            .lean();
        if (!form) {
            throw AppError.Unauthorized('Form not found or access denied');
        }
        return form;
    }

    async create(userId: string, formId: string, data: SectionCore) {
        await this.authorizeForm(formId, userId);
        const sectionCount = await SectionModel.countDocuments({ formId });

        const createdSection = await SectionModel.create({
            formId,
            ...data,
            index: sectionCount,
        });

        return createdSection.toObject();
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
            return deletedSection.toObject();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async update(ids: I, data: Partial<SectionCore>) {
        const { sectionId, formId, userId } = ids;
        await this.authorizeForm(formId, userId);

        const updatedSection = await SectionModel.findByIdAndUpdate(
            sectionId,
            data,
            { returnDocument: 'after', runValidators: true }
        )
            .select('-__v')
            .lean();
        if (!updatedSection) {
            throw AppError.SectionNotFound('Section not found');
        }
        return updatedSection;
    }

    async get(formId: string, userId: string) {
        await this.authorizeForm(formId, userId);
        return await SectionModel.find({ formId }).select('-__v').sort({
            index: 1,
        });
    }

    async getById(ids: I) {
        const { sectionId, formId, userId } = ids;
        await this.authorizeForm(formId, userId);

        const section = await SectionModel.findOne({
            _id: sectionId,
            formId,
        })
            .select('-__v')
            .lean();
        if (!section) {
            throw AppError.SectionNotFound('Section not found');
        }

        return section;
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

            return await SectionModel.find({ formId })
                .sort({ index: 1 })
                .lean();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default SectionService;
