import { Section } from '@/types/form/forms';
import SectionModel from '../schemas/forms.sections';
import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';
import QuestionsModel from '../schemas/forms.questions';

interface I {
    userId: string;
    formId: string;
    sectionId: string;
}

class SectionService {
    async validateOwnership(formId: string, userId: string) {
        const form = await FormsModel.findById(formId).lean();
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        if (form.userId !== userId) {
            throw AppError.Unauthorized(
                'You are not authorized to add questions to this form'
            );
        }
    }
    async validateSection(formId: string, sectionId: string) {
        const section = await SectionModel.findOne({
            _id: sectionId,
            formId,
        }).lean();
        if (!section) {
            throw AppError.NotFound('Section not found');
        }
    }

    async create(
        userId: string,
        formId: string,
        data: Omit<Section, 'questions'>
    ) {
        const form = await FormsModel.findById(formId).lean();

        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        if (form.userId !== userId) {
            throw AppError.Unauthorized(
                'You are not authorized to add sections to this form'
            );
        }

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
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const deletedSection = await SectionModel.findOneAndDelete({
            _id: sectionId,
            formId,
        });
        if (!deletedSection) {
            throw AppError.SectionDeletionFailed('Section not found');
        }

        await Promise.all([
            QuestionsModel.deleteMany({ sectionId }),
            SectionModel.updateMany(
                { formId, index: { $gt: deletedSection.index } },
                { $inc: { index: -1 } }
            ),
        ]);
        return deletedSection.toObject();
    }

    async update(ids: I, data: Partial<Section>) {
        const { sectionId, formId, userId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const updatedSection = await SectionModel.findByIdAndUpdate(
            sectionId,
            data,
            { new: true }
        );
        if (!updatedSection) {
            throw AppError.SectionNotFound('Section not found');
        }
        const { __v, ...rest } = updatedSection.toObject();
        return rest;
    }

    async get(formId: string) {
        const sections = await SectionModel.find({ formId });
        if (!sections) {
            throw AppError.SectionNotFound('No sections found for this form');
        }
        return sections.map((section) => {
            const { __v, ...rest } = section.toObject();
            return rest;
        });
    }

    async getById(ids: I) {
        const { sectionId, formId, userId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const section = await SectionModel.findById(sectionId);
        if (!section) {
            throw AppError.SectionNotFound('Section not found');
        }
        const { __v, ...rest } = section.toObject();
        return rest;
    }

    async reorder(
        ids: Omit<I, 'sectionId'>,
        data: { sectionId: string; index: number }[]
    ) {
        const { formId, userId } = ids;
        await this.validateOwnership(formId, userId);

        const sections = await SectionModel.find({ formId });
        if (!sections) {
            throw AppError.SectionNotFound('No sections found for this form');
        }
        const sectionMap = new Map(
            sections.map((section) => [section._id.toString(), section])
        );
        for (const { sectionId } of data) {
            if (!sectionMap.has(sectionId)) {
                throw AppError.SectionNotFound(
                    `Section with ID ${sectionId} not found in this form`
                );
            }
        }

        await SectionModel.bulkWrite(
            data.map(({ sectionId }, i) => ({
                updateOne: {
                    filter: { _id: sectionId, formId },
                    update: { $set: { index: -(i + 1) } },
                },
            }))
        );

        await SectionModel.bulkWrite(
            data.map(({ sectionId, index }) => ({
                updateOne: {
                    filter: { _id: sectionId, formId },
                    update: { $set: { index } },
                },
            }))
        );

        const reorderedSections = await SectionModel.find({ formId }).sort({
            index: 1,
        });

        return reorderedSections.map((section) => {
            const { __v, ...rest } = section.toObject();
            return rest;
        });
    }
}

export default SectionService;
