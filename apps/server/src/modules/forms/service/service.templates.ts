import AutoBoundClass from '@/utils/AutoBoundClass';
import TemplateModel from '../schemas/schemas.template';

import SectionModel from '../schemas/schemas.sections';
import FormsModel from '../schemas/schemas.forms';
import QuestionsModel from '../schemas/schemas.questions';
import { Form } from '@paperwork/types';

class TemplatesService extends AutoBoundClass {
    constructor() {
        super();
    }

    async all(query: any) {
        const { category, isFeatured } = query;
        const filter: any = {};

        if (category) filter.category = category;
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';

        return await TemplateModel.find(filter);
    }

    async getByTemplateId(templateId: string) {
        const template = await TemplateModel.findById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        return template;
    }

    async cloneByTemplateId(
        templateId: string,
        userId: string,
        customName?: string
    ) {
        const template = await TemplateModel.findById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        /**
         * Everything below works on plain objects: spreading a Mongoose
         * document/subdocument copies internals (`$__`, `_doc`) rather than
         * the fields, so section/question copies arrived empty and failed
         * schema validation ("title/index is required").
         */
        const plain = template.toObject();

        const {
            _id: _formId,
            createdAt: _formCreatedAt,
            updatedAt: _formUpdatedAt,
            __v: _formVersion,
            ...formFields
        } = plain.form as Record<string, unknown>;

        const formObj = {
            ...formFields,
            userId,
            name: customName || `${template.name} (Copy)`,
            responseCount: 0,
        } as Form;

        const newForm = await FormsModel.create(formObj);
        const newFormId = newForm._id.toHexString();

        const sectionIdMap = new Map<string, string>();

        const newSections = await Promise.all(
            plain.sections.map(async (oldSection) => {
                const {
                    id: templateSectionId,
                    _id: _sectionId,
                    createdAt: _sectionCreatedAt,
                    updatedAt: _sectionUpdatedAt,
                    __v: _sectionVersion,
                    ...sectionFields
                } = oldSection as unknown as Record<string, unknown>;

                const newSection = await SectionModel.create({
                    ...sectionFields,
                    formId: newFormId,
                });
                sectionIdMap.set(
                    String(templateSectionId),
                    newSection._id.toHexString()
                );
                return newSection;
            })
        );

        if (!newSections.length && plain.questions.length) {
            throw new Error(
                'Template must contain a section for its questions'
            );
        }

        // 3. Clone questions with new IDs and remapped section IDs
        const newQuestions = await Promise.all(
            plain.questions.map(async (oldQuestion) => {
                const {
                    sectionId: oldSectionId,
                    _id: _questionId,
                    createdAt: _questionCreatedAt,
                    updatedAt: _questionUpdatedAt,
                    __v: _questionVersion,
                    ...questionFields
                } = oldQuestion as unknown as Record<string, unknown>;

                const newSectionId =
                    sectionIdMap.get(String(oldSectionId)) ||
                    newSections[0]?._id.toHexString();

                if (!newSectionId) {
                    throw new Error(
                        'Template question references an unknown section'
                    );
                }

                return QuestionsModel.create({
                    ...questionFields,
                    formId: newFormId,
                    sectionId: newSectionId,
                });
            })
        );

        return {
            ...newForm.toJSON(),
            sections: newSections.map((s) => s.toJSON()),
            questions: newQuestions.map((q) => q.toJSON()),
        };
    }

    async seed(body: any) {
        const { name, category, isFeatured, form, sections, questions } = body;

        return await TemplateModel.create({
            name,
            category,
            isFeatured: isFeatured ?? false,
            form,
            sections,
            questions,
        });
    }
}

export default TemplatesService;
