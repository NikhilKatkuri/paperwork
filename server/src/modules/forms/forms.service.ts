import { FormType } from '@/types/form/forms';
import FormsModel from './schemas/forms';
import { AppError } from '@/utils/AppError';

interface IformData extends Omit<FormType, 'sectionss'> {
    userId: string;
}

class FormsService {
    async create(data: IformData) {
        const form = await FormsModel.create(data);
        if (!form) {
            throw AppError.FormCreationFailed('Failed to create form');
        }

        const { __v, ...cleanForm } = form.toObject();

        return cleanForm;
    }

    async get(formId: string, userId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId }).lean();
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        const { __v, ...cleanForm } = form.toObject();
        return cleanForm;
    }

    async delete(formId: string, userId: string) {
        const form = await FormsModel.findOneAndDelete({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
    }

    async update(data: IformData, formId: string) {
        const { userId, ...updateData } = data;
        const form = await FormsModel.findById(formId);
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        if (form.userId !== userId) {
            throw AppError.Unauthorized(
                'You are not authorized to update this form'
            );
        }
        if (Object.keys(updateData).length === 0) {
            throw AppError.BadRequest('No update data provided');
        }

        form.set(updateData);
        await form.save();

        const { __v, ...cleanForm } = form.toObject();
        return cleanForm;
    }

    async publish() {}
    async unPublish() {}
    async duplicate() {}

    async getAll() {}
}

export default FormsService;
