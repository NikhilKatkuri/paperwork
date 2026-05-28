import FormsModel from '../schemas/forms';
import { AppError } from '@/utils/AppError';
import SectionModel from '../schemas/forms.sections';
import QuestionsModel from '../schemas/forms.questions';
import { ResponseCore } from '@/types/form/forms';
import FormResponseModel from '../schemas/forms.responses';

class FillService {
    async get(formId: string) {
        const form = await FormsModel.findById(formId).select('-__v').lean();
        if (!form) throw AppError.FormNotFound('Form not found');

        const [sections, allQuestions] = await Promise.all([
            SectionModel.find({ formId })
                .sort({ index: 1 })
                .select('-__v -createdAt -updatedAt')
                .lean(),
            QuestionsModel.find({ formId })
                .sort({ index: 1 })
                .select('-__v -createdAt -updatedAt')
                .lean(),
        ]);

        if (!sections.length)
            throw AppError.SectionNotFound('This form has no content yet');

        const questionsBySection = allQuestions.reduce(
            (acc, q) => {
                const sId = q.sectionId.toString();
                if (!acc[sId]) acc[sId] = [];
                acc[sId].push(q);
                return acc;
            },
            {} as Record<string, any[]>
        );

        const nestedSections = sections.map((section) => ({
            ...section,
            questions: questionsBySection[section._id.toString()] || [],
        }));

        return {
            form,
            sections: nestedSections,
        };
    }

    async post(data: ResponseCore) {
        const { formId, userId, email, answers } = data;

        const form = await FormsModel.findById(formId).lean();
        if (!form) throw AppError.FormNotFound('Form not found');

        const validQuestionIds = await QuestionsModel.find({ formId }).distinct(
            '_id'
        );
        const validIdStrings = validQuestionIds.map((id) => id.toString());

        const isDataValid = answers.every((ans) =>
            validIdStrings.includes(ans.questionId.toString())
        );

        if (!isDataValid) {
            throw AppError.BadRequest(
                'Submission contains invalid question references'
            );
        }

        return await FormResponseModel.create({
            formId,
            userId,
            email,
            answers,
        });
    }
}

export default FillService;
