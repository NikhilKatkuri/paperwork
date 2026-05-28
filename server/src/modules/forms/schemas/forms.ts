import { FormDocument } from '@/types/form/Document';
import mongoose, { Schema } from 'mongoose';

const formsSchema = new Schema<FormDocument>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        allowedDomains: { type: [String], default: undefined },
        isPublished: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

formsSchema.pre('save', async function () {
    if (!this.isPrivate && this.allowedDomains?.length) {
        throw new Error(
            'allowedDomains can only be set when isPrivate is true'
        );
    }
});

formsSchema.index({ userId: 1, createdAt: -1 });
formsSchema.set('toObject', {
    transform: (_, ret) => {
        Reflect.deleteProperty(ret, '__v');
        return ret;
    },
});

const FormsModel = mongoose.model<FormDocument>('Form', formsSchema);

export default FormsModel;
