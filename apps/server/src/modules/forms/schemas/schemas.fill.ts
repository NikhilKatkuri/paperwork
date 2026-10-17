import transform from '@/schemas/tranformer';
import { FormResponseDocument } from '@/types';
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
        browser: { type: String, required: false },
        os: { type: String, required: false },
        device: { type: String, required: false },
        country: { type: String, required: false },
        timeSpentSeconds: { type: Number, required: false },
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
        questionSlug: {
            type: String,
            required: false,
        },
        value: {
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
        idempotencyKey: {
            type: String,
            required: false,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        currentSectionId: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

FormResponseSchema.index({ formId: 1, userId: 1 });

// A submission key is only unique within its form; legacy rows without a
// key stay exempt via the partial filter.
FormResponseSchema.index(
    { formId: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    }
);

FormResponseSchema.index({ 'answers.questionId': 1, 'answers.value': 1 });

/**
 * `_id` is the tiebreaker: timestamps within the same millisecond made
 * skip-based pagination non-deterministic (rows could repeat or vanish
 * between pages). A reversed traversal of this index serves both directions.
 */
FormResponseSchema.index({ formId: 1, createdAt: -1, _id: -1 });

// Filtered response lists ("show only responses that answered question X").
FormResponseSchema.index({ formId: 1, 'answers.questionId': 1, createdAt: -1 });
FormResponseSchema.set('toJSON', { transform });
FormResponseSchema.set('toObject', { transform });

const FormResponseModel = mongoose.model<FormResponseDocument>(
    'FormResponse',
    FormResponseSchema
);

/**
 * Per-(form,user) submission counter for atomic `maxResponsesPerUser`
 * enforcement. `_id` is `${formId}:${userId}`; the guarded `$inc` makes the
 * limit check race-free inside the submission transaction.
 */
const ResponseCounterSchema = new Schema(
    {
        _id: { type: String, required: true },
        count: { type: Number, required: true, default: 0 },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const ResponseCounterModel = mongoose.model(
    'ResponseCounter',
    ResponseCounterSchema
);

export default FormResponseModel;
