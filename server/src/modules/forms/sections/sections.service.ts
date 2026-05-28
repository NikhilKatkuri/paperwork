import { Section } from '@/types/form/forms';
import SectionModel from '../schemas/forms.sections';
import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';

class SectionService {
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

    async delete(sectionId: string) {
        const deletedSection = await SectionModel.findByIdAndDelete(sectionId);
        if (!deletedSection) {
            throw AppError.SectionDeletionFailed('Failed to delete section');
        }
        /** need to delete questions associated with this section */
        return deletedSection;
    }

    async update(sectionId: string, data: Partial<Section>) {
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

    async getById(sectionId: string) {
        const section = await SectionModel.findById(sectionId);
        if (!section) {
            throw AppError.SectionNotFound('Section not found');
        }
        const { __v, ...rest } = section.toObject();
        return rest;
    }

    async reorder(
        formId: string,
        data: { sectionId: string; index: number }[]
    ) {
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
