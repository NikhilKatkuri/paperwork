import mongoose, { Schema } from 'mongoose';
import { SectionDocument } from '@/types/form/Document';
import { SectionAction, SectionDependsOn } from '@/types/form/forms';

export const sectionActionEnum = [
    'NEXT_SECTION',
    'GO_TO_SECTION',
    'SUBMIT_FORM',
] as const;

const sectionActionSchema = new Schema<SectionAction & { sectionId?: string }>(
    {
        actionType: {
            type: String,
            enum: sectionActionEnum,
            required: true,
            default: 'NEXT_SECTION',
        },
        sectionId: {
            type: String,
            required: function (this: { actionType: string }) {
                return this.actionType === 'GO_TO_SECTION';
            },
        },
    },
    { _id: false }
);

const onAnswerSchema = new Schema<SectionDependsOn>(
    {
        questionId: { type: String, required: true },
        value: { type: String, required: true },
        action: { type: sectionActionSchema, required: true },
    },
    { _id: false }
);

const sectionSchema = new Schema<SectionDocument>(
    {
        formId: { type: String, required: true, index: true },
        index: { type: Number, required: true, min: 0 },

        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, required: false, maxlength: 1000 },

        onAnswer: { type: [onAnswerSchema], default: [] },
        defaultAction: { type: sectionActionSchema, required: false },
    },
    {
        timestamps: true,
    }
);

sectionSchema.pre('validate', function (this: SectionDocument) {
    const selfId = this._id?.toString();
    if (!selfId) return;

    if (
        this.defaultAction?.actionType === 'GO_TO_SECTION' &&
        this.defaultAction?.sectionId === selfId
    ) {
        throw new Error(
            'A section cannot navigate to itself via defaultAction'
        );
    }
    for (const rule of this.onAnswer ?? []) {
        if (
            rule.action?.actionType === 'GO_TO_SECTION' &&
            rule.action?.sectionId === selfId
        ) {
            throw new Error('A section cannot navigate to itself via onAnswer');
        }
    }
});

sectionSchema.index({ formId: 1, index: 1 });

const transform = (_doc: unknown, ret: Record<string, any>) => {
    Reflect.deleteProperty(ret, '__v');
    return ret;
};
sectionSchema.set('toObject', { transform });
sectionSchema.set('toJSON', { transform });

const SectionModel =
    (mongoose.models.Section as mongoose.Model<SectionDocument>) ||
    mongoose.model<SectionDocument>('Section', sectionSchema);

export default SectionModel;
