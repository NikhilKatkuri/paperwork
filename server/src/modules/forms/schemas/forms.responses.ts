import { FormResponseDocument } from '@/types/form/Document';
import mongoose, { Schema } from 'mongoose';

const FormResponseSchema = new Schema<FormResponseDocument>({
    formId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    answers: {
        type: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Question',
                    required: true,
                },
                answer: {
                    type: Schema.Types.Mixed,
                    required: true,
                },
            },
        ],
    },
});

FormResponseSchema.index({ formId: 1, userId: 1 }, { unique: true });
FormResponseSchema.index({ 'answers.questionId': 1, 'answers.values': 1 });
FormResponseSchema.index({ formId: 1, createdAt: -1 });

const FormResponseModel = mongoose.model<FormResponseDocument>(
    'FormResponse',
    FormResponseSchema
);

export default FormResponseModel;
