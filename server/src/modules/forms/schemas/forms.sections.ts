import mongoose, { Schema } from 'mongoose';
import { SectionDocument } from '@/types/form/Document';

export const sectionActionEnum = [
    'NEXT_SECTION',
    'GO_TO_SECTION',
    'SUBMIT_FORM',
] as const;

const sectionActionSchema = new Schema(
    {
        actionType: {
            type: String,
            enum: sectionActionEnum,
            required: true,
            default: 'NEXT_SECTION',
        },
        sectionIndex: {
            type: Number,
            required: false,
        },
    },
    { _id: false }
);

const onAnswerSchema = new Schema(
    {
        questionIndex: { type: Number, required: true },
        value: { type: String, required: true },
        action: { type: sectionActionSchema, required: true },
    },
    { _id: false }
);

const sectionSchema = new Schema<SectionDocument>(
    {
        formId: { type: String, required: true, index: true },
        index: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: false },
        onAnswer: { type: [onAnswerSchema], default: [] },
        defaultAction: { type: sectionActionSchema, required: false },
    },
    {
        timestamps: true,
    }
);

sectionSchema.index({ formId: 1, index: 1 }, { unique: true });
sectionSchema.set('toObject', {
    transform: (_, ret) => {
        Reflect.deleteProperty(ret, '__v');
        return ret;
    },
});

const SectionModel = mongoose.model<SectionDocument>('Section', sectionSchema);

export default SectionModel;
