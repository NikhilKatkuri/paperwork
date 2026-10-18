import { FormSettings, FORM_THEMES } from '@paperwork/types';
import mongoose, { Schema } from 'mongoose';
import { FormDocument, TemplateDocument } from '@/types';
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

export const TemplateFormSchema = new Schema<TemplateDocument['form']>(
    {
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

const formsSchema = new Schema<FormDocument>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true, maxlength: 200 },
        isPrivate: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: false },
        allowedDomains: { type: [String], default: undefined },
        theme: { type: String, enum: FORM_THEMES, default: 'default' },

        /**
         * Server-owned counter for `settings.maxResponses`. It must be
         * declared here or `strict: true` strips the `$inc` on submission
         * (and `responseCount: 0` on create/clone), which silently disables
         * the form-wide response limit.
         */
        responseCount: { type: Number, default: 0, min: 0 },

        settings: { type: FormsSettingSchema, default: () => ({}) },
    },
    {
        timestamps: true,
        strict: true,
    }
);

formsSchema.pre('save', function () {
    // Domain-restricted forms are private-by-definition: auto-mark private
    // instead of throwing, so the feature is reachable. Explicit public +
    // domains is still rejected with a proper 400.
    //
    // NOTE: synchronous hook — no `next` parameter. Declaring one makes
    // Mongoose invoke this without a callback (`next is not a function`),
    // which broke every form create/save.
    if (this.allowedDomains?.length && !this.isPrivate) {
        // If domains were set on a public form via API, keep them and flip
        // private on — the fill guard accepts (isPrivate + domains).
        this.isPrivate = true as any;
    }
});

formsSchema.index({ userId: 1, createdAt: -1 });

formsSchema.set('toObject', { transform });
formsSchema.set('toJSON', { transform });

const FormsModel = mongoose.model<FormDocument>('Form', formsSchema);

export default FormsModel;
