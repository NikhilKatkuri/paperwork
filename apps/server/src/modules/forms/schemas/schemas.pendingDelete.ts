import { model, Model, Schema } from 'mongoose';

export interface PendingDeleteDocument {
    userId: string;
    formId: string;
    createdAt: Date;
}

const pendingDeleteSchema = new Schema<PendingDeleteDocument>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        formId: {
            type: String,
            required: true,
            index: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: 'pending_deletes',
        strict: true,
    }
);

pendingDeleteSchema.index({ userId: 1, formId: 1 }, { unique: true });
pendingDeleteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const PendingDeleteModel: Model<PendingDeleteDocument> = model<PendingDeleteDocument>(
    'PendingDelete',
    pendingDeleteSchema
);

export default PendingDeleteModel;
