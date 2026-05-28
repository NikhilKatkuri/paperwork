import { Section } from '@/types/form/forms';
import SectionModel from '../schemas/forms.sections';
import { AppError } from '@/utils/AppError';

class SectionService {
    async create(formId: string, data: Omit<Section, 'questions'>) {
        const _section = {
            formId,
            ...data,
        };
        const createdSection = await SectionModel.create(_section);
        if (!createdSection) {
            throw AppError.SectionCreationFailed('Failed to create section');
        }
        const { __v, ...rest } = createdSection.toObject();
        return rest;
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
        const updatedSections = [];
        for (const { sectionId, index } of data) {
            const section = sectionMap.get(sectionId);
            if (!section) {
                throw AppError.SectionNotFound(
                    `Section with ID ${sectionId} not found`
                );
            }
            section.index = index;
            updatedSections.push(section.save());
        }
        await Promise.all(updatedSections);
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
