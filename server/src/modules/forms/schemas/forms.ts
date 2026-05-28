import { FormDocument } from '@/types/form/Document';
import { FormSettings } from '@/types/form/forms';
import mongoose, { Schema } from 'mongoose';

const FormsSettingSchema = new Schema<FormSettings>(
    {
        maxResponses: { type: Number, default: undefined },
        maxResponsesPerUser: { type: Number, default: undefined },
        closeDate: { type: Date, default: undefined },
        startDate: { type: Date, default: undefined },
        timeLimitPerResponse: { type: Number, default: undefined },

        collectEmail: { type: Boolean, default: false },

        shuffleQuestions: { type: Boolean, default: false },
        allowEditResponse: { type: Boolean, default: false },
        saveAndContinueLater: { type: Boolean, default: false },
        progressBar: { type: Boolean, default: false },

        customConfirmationMessage: { type: String, default: undefined },
        redirectUrl: { type: String, default: undefined },
    },
    {
        _id: false,
        timestamps: false,
        strict: true,
    }
);

const formsSchema = new Schema<FormDocument>(
    {
        userId: { type: String, required: true, index: true },

        title: { type: String, required: true },
        description: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: false },
        allowedDomains: { type: [String], default: undefined },

        settings: { type: FormsSettingSchema, default: () => ({}) },
    },
    {
        timestamps: true,
        strict: true,
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
