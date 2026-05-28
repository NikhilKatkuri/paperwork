import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';
import { IformData } from '../types';

class FormsService {
    async create(data: IformData) {
        const form = await FormsModel.create(data);
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
        const form = await FormsModel.findOneAndDelete({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        /** need to delete associated sections and questionss */
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

        return form.toObject();
    }

    async publish(userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        if (form.isPublished) {
            throw AppError.FormPublishFailed('Form is already published');
        }

        form.isPublished = true;
        try {
            await form.save();
        } catch (error) {
            throw AppError.FormPublishFailed('Failed to publish form');
        }

        return form.toObject();
    }

    async unPublish(userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        if (form.isPublished === false) {
            throw AppError.BadRequest('Form is already unpublished');
        }

        form.isPublished = false;
        try {
            await form.save();
        } catch (error) {
            throw AppError.FormPublishFailed('Failed to unpublish form');
        }

        return form.toObject();
    }

    async duplicate(userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        const { _id, ...cleanForm } = form.toObject();

        cleanForm.isPublished = false;

        const duplicatedForm = await FormsModel.create({
            ...cleanForm,
            _id: undefined,
            title: `${cleanForm.title} (Copy)`,
            isPublished: false,
            createdAt: undefined,
            updatedAt: undefined,
            userId,
        } as any);

        if (!duplicatedForm) {
            throw AppError.FormCreationFailed('Failed to duplicate form');
        }

        const { ...finalForm } = duplicatedForm.toObject();
        /** related data must be duplicated as well */

        return finalForm;
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
