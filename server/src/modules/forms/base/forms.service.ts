import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';
import { IformData } from '../types';

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

        const { __v, ...cleanForm } = form.toObject();
        return cleanForm;
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

        const { __v, ...cleanForm } = form.toObject();
        return cleanForm;
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

        const { __v, ...cleanForm } = form.toObject();
        return cleanForm;
    }

    async duplicate(userId: string, formId: string) {
        const form = await FormsModel.findOne({ _id: formId, userId });
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }

        const { __v, _id, ...cleanForm } = form.toObject();

        cleanForm.isPublished = false;

        const duplicatedForm = await FormsModel.create({
            ...cleanForm,
            userId,
        });

        if (!duplicatedForm) {
            throw AppError.FormCreationFailed('Failed to duplicate form');
        }

        const { __v: _, ...finalForm } = duplicatedForm.toObject();
        /** related data must be duplicated as well */

        return finalForm;
    }

    async getAll(userId: string) {
        const forms = await FormsModel.find({ userId }).lean();
        if (!forms) {
            throw AppError.FormNotFound('No forms found for this user');
        }
        const cleanForms = forms.map((form) => {
            const { __v, ...cleanForm } = form.toObject();
            return cleanForm;
        });
        return cleanForms;
    }
}

export default FormsService;
