import { FormSettings, FORM_THEMES } from '@paperwork/types';
import mongoose, { Schema } from 'mongoose';
import { FormDocument } from '@/types';
import transform from '@/schemas/tranformer';

const FormsSettingSchema = new Schema<FormSettings>(
    {
        maxResponses: { type: Number, min: 1, default: undefined },
        maxResponsesPerUser: { type: Number, min: 1, default: undefined },
        closeDate: { type: Date, default: undefined },
        startDate: { type: Date, default: undefined },
        timeLimitPerResponse: { type: Number, default: undefined },

        collectEmail: { type: Boolean, default: false },

        shuffleQuestions: { type: Boolean, default: false },
        allowEditResponse: { type: Boolean, default: false },
        saveAndContinueLater: { type: Boolean, default: false },
        progressBar: { type: Boolean, default: false },

        customConfirmationMessage: { type: String, default: undefined },
        redirectUrl: {
            type: String,
            default: undefined,
            validate: {
                validator: (v: string | undefined) =>
                    !v || /^https?:\/\//.test(v),
                message: 'redirectUrl must start with http:// or https://',
            },
        },
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
        name: { type: String, required: true, maxlength: 200 },
        isPrivate: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: false },
        allowedDomains: { type: [String], default: undefined },
        theme: { type: String, enum: FORM_THEMES, default: 'default' },

        settings: { type: FormsSettingSchema, default: () => ({}) },
    },
    {
        timestamps: true,
        strict: true,
    }
);

formsSchema.pre('save', function (next) {
    // Domain-restricted forms are private-by-definition: auto-mark private
    // instead of throwing, so the feature is reachable. Explicit public +
    // domains is still rejected with a proper 400.
    if (this.allowedDomains?.length && !this.isPrivate) {
        // If domains were set on a public form via API, keep them and flip
        // private on — the fill guard accepts (isPrivate + domains).
        this.isPrivate = true as any;
    }
    (next as () => void)();
});

formsSchema.index({ userId: 1, createdAt: -1 });

formsSchema.set('toObject', { transform });
formsSchema.set('toJSON', { transform });

const FormsModel = mongoose.model<FormDocument>('Form', formsSchema);

export default FormsModel;
