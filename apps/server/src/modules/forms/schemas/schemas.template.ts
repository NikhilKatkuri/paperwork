import { TemplateDocument } from '@/types';
import mongoose, { Schema } from 'mongoose';
import { TemplateFormSchema } from './schemas.forms';
import { SectionTemplateSchema } from './schemas.sections';
import { QuestionTemplateSchema } from './schemas.questions';

const schemasTemplate = new Schema<TemplateDocument>({
    name: { type: String, required: true },
    description: { type: String, maxlength: 1000 },
    category: { type: String, required: true },
    isFeatured: { type: Boolean, required: true },
    form: { type: TemplateFormSchema, required: true },
    sections: { type: [SectionTemplateSchema], required: true },
    questions: { type: [QuestionTemplateSchema], required: true },
});

const TemplateModel = mongoose.model<TemplateDocument>(
    'Template',
    schemasTemplate
);

export default TemplateModel;
