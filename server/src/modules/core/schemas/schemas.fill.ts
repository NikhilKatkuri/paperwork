import { FormResponseDocument } from '@/types/form/Document';
import mongoose, { Schema } from 'mongoose';

const metaDataSchema = new Schema<FormResponseDocument['metadata']>(
    {
        userAgent: {
            type: String,
            required: true,
        },
        ipAddress: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
        timestamps: false,
    }
);

const AnswerEntrySchema = new Schema<FormResponseDocument['answers'][number]>(
    {
        questionId: {
            type: String,
            required: true,
        },
        values: {
            type: [String],
            required: true,
        },
    },
    {
        _id: false,
        timestamps: false,
    }
);

const FormResponseSchema = new Schema<FormResponseDocument>(
    {
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
            type: [AnswerEntrySchema],
            required: true,
        },
        metadata: {
            type: metaDataSchema,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

FormResponseSchema.index({ formId: 1, userId: 1 }, { unique: true });
FormResponseSchema.index({ 'answers.questionId': 1, 'answers.values': 1 });
FormResponseSchema.index({ formId: 1, createdAt: -1 });

const FormResponseModel = mongoose.model<FormResponseDocument>(
    'FormResponse',
    FormResponseSchema
);

export default FormResponseModel;
