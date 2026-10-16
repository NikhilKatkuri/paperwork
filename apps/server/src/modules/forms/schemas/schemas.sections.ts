import { SectionDocument } from '@/types';
import { SectionAction, SectionRule } from '@paperwork/types';
import mongoose, { Schema } from 'mongoose';
import transform from '@/schemas/tranformer';

export const sectionActionSchema = new Schema<SectionAction & { sectionId?: string }>(
    {
        type: {
            type: String,
            enum: ['NEXT_SECTION', 'GO_TO_SECTION', 'SUBMIT_FORM'],
            required: true,
            default: 'NEXT_SECTION',
        },
        targetSectionId: {
            type: String,
            required: function (this: { type: string }) {
                return this.type === 'GO_TO_SECTION';
            },
        },
    },
    { _id: false }
);

const rulesSchema = new Schema<SectionRule>({
    questionId: { type: String, required: true },
    operator: {
        type: String,
        enum: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN'],
        required: true,
    },
    expectedValue: { type: Schema.Types.Mixed, required: true },
    action: { type: sectionActionSchema, required: true },
});

const sectionSchema = new Schema<SectionDocument>(
    {
        formId: { type: String, required: true, index: true },

        index: { type: Number, required: true, min: 0 },
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, required: false, maxlength: 1000 },
        rules: { type: [rulesSchema], default: [], required: false },
        defaultAction: { type: sectionActionSchema, required: false },
    },
    {
        timestamps: true,
    }
);

sectionSchema.pre('validate', function (this: SectionDocument) {
    // NOTE: `this.invalidate()` (not `throw`) so failures surface as a
    // mongoose ValidationError → 400, instead of a 500.
    if (!this._id) return;
    const selfId: string = this._id.toHexString();

    if (
        this.defaultAction?.type === 'GO_TO_SECTION' &&
        this.defaultAction?.targetSectionId === selfId
    ) {
        this.invalidate(
            'defaultAction',
            'A section cannot navigate to itself via defaultAction'
        );
    }
    for (const rule of this.rules ?? []) {
        if (
            rule.action?.type === 'GO_TO_SECTION' &&
            rule.action?.targetSectionId === selfId
        ) {
            this.invalidate(
                'rules',
                'A section cannot navigate to itself via onAnswer'
            );
        }
    }
});

sectionSchema.index({ formId: 1, index: 1 });

sectionSchema.set('toObject', { transform });
sectionSchema.set('toJSON', { transform });

const SectionModel =
    (mongoose.models.Section as mongoose.Model<SectionDocument>) ||
    mongoose.model<SectionDocument>('Section', sectionSchema);

export default SectionModel;
