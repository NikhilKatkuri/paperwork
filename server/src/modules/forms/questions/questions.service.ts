import { QuestionDocument } from '@/types/form/Document';
import QuestionsModel from '../schemas/forms.questions';
import { AppError } from '@/utils/AppError';
import FormsModel from '../schemas/forms';
import SectionModel from '../schemas/forms.sections';

interface T extends QuestionDocument {
    userId: string;
}

interface I {
    userId: string;
    formId: string;
    sectionId: string;
    questionId: string;
}

class questionService {
    async validateOwnership(formId: string, userId: string) {
        const form = await FormsModel.findById(formId).lean();
        if (!form) {
            throw AppError.FormNotFound('Form not found');
        }
        if (form.userId !== userId) {
            throw AppError.Unauthorized(
                'You are not authorized to add questions to this form'
            );
        }
    }
    async validateSection(formId: string, sectionId: string) {
        const section = await SectionModel.findOne({
            _id: sectionId,
            formId,
        }).lean();
        if (!section) {
            throw AppError.NotFound('Section not found');
        }
    }
    async create(data: T) {
        const { formId, sectionId, userId, ...questionData } = data;

        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const questionCount = await QuestionsModel.countDocuments({
            sectionId,
        });

        const createdQuestion = await QuestionsModel.create({
            formId,
            sectionId,
            ...questionData,
            index: questionCount,
        });

        return createdQuestion.toObject();
    }

    async delete(ids: I) {
        const { formId, sectionId, questionId, userId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const question = await QuestionsModel.findOneAndDelete({
            _id: questionId,
            formId,
            sectionId,
        }).lean();

        if (!question) {
            throw AppError.NotFound('Question not found');
        }

        await QuestionsModel.updateMany(
            { sectionId, index: { $gt: question.index } },
            { $inc: { index: -1 } }
        );
    }

    async update(ids: I, data: Partial<T>) {
        const { formId, sectionId, questionId, userId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const updatedQuestion = await QuestionsModel.findOneAndUpdate(
            { _id: questionId, formId, sectionId },
            { $set: data },
            { new: true }
        )
            .select('-__v')
            .lean();

        if (!updatedQuestion) {
            throw AppError.NotFound('Question not found');
        }

        return updatedQuestion;
    }
    async get(ids: Omit<I, 'questionId'>) {
        const { formId, sectionId, userId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const questions = await QuestionsModel.find({
            formId,
            sectionId,
        })
            .sort({ index: 1 })
            .select('-__v')
            .lean();
        if (!questions) {
            throw AppError.NotFound('Questions not found');
        }
        return questions;
    }

    async getById(ids: I) {
        const { formId, sectionId, userId, questionId } = ids;
        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const question = await QuestionsModel.findOne({
            _id: questionId,
            formId,
            sectionId,
        })
            .select('-__v')
            .lean();
        if (!question) {
            throw AppError.NotFound('Question not found');
        }
        return question;
    }

    async reorder(ids: Omit<I, 'questionId'>, order: string[]) {
        const { formId, sectionId, userId } = ids;

        await this.validateOwnership(formId, userId);
        await this.validateSection(formId, sectionId);

        const questions = await QuestionsModel.find({ formId, sectionId })
            .select('_id')
            .lean();

        const existingIds = questions.map((q) => q._id.toString());

        const isValid =
            order.length === existingIds.length &&
            order.every((id) => existingIds.includes(id));

        if (!isValid) {
            throw AppError.BadRequest(
                'Invalid question order — ids do not match'
            );
        }

        await QuestionsModel.bulkWrite(
            order.map((questionId, i) => ({
                updateOne: {
                    filter: { _id: questionId, formId, sectionId },
                    update: { $set: { index: -(i + 1) } },
                },
            }))
        );

        await QuestionsModel.bulkWrite(
            order.map((questionId, index) => ({
                updateOne: {
                    filter: { _id: questionId, formId, sectionId },
                    update: { $set: { index } },
                },
            }))
        );

        return QuestionsModel.find({ formId, sectionId })
            .sort({ index: 1 })
            .select('-__v')
            .lean();
    }
}

export default questionService;
