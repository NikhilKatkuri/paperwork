import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import fieldsValidator from '@/modules/forms/validators/validator.feilds';
import { Question } from '@paperwork/types';

interface I {
    userId: string;
    formId: string;
    sectionId: string;
    questionId: string;
}

class QuestionService {
    private async authorizeAccess(
        ids: Omit<I, 'questionId'>,
        session?: mongoose.ClientSession
    ) {
        const { formId, sectionId, userId } = ids;

        const formDocument = await FormsModel.findOne({
            _id: formId,
            userId,
        }).session(session || null);
        const form = formDocument?.toJSON();
        if (!form) throw AppError.Unauthorized('Form access denied');

        const sectionDocument = await SectionModel.findOne({
            _id: sectionId,
            formId,
        }).session(session || null);
        const section = sectionDocument?.toJSON();
        if (!section) throw AppError.NotFound('Section not found in this form');

        return { form, section };
    }

    async create(params: {
        userId: string;
        formId: string;
        sectionId: string;
        data: Question;
    }) {
        const { formId, sectionId, userId, data: questionData } = params;

        await this.authorizeAccess({ formId, sectionId, userId });

        const maxDoc = await QuestionsModel.findOne({ sectionId })
            .sort({ index: -1 })
            .select('index')
            .lean();

        const createdQuestion = await QuestionsModel.create({
            formId,
            sectionId,
            ...fieldsValidator.getSafeQuestionData(questionData),
            index: (maxDoc?.index ?? -1) + 1,
        });

        return createdQuestion.toJSON();
    }

    async delete(ids: I) {
        const { formId, sectionId, questionId, userId } = ids;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await this.authorizeAccess({ formId, sectionId, userId }, session);

            const question = await QuestionsModel.findOneAndDelete(
                { _id: questionId, formId, sectionId },
                { session }
            );

            if (!question) throw AppError.NotFound('Question not found');

            await QuestionsModel.updateMany(
                { sectionId, index: { $gt: question.index } },
                { $inc: { index: -1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async update(ids: I, data: Partial<Question>) {
        const { formId, sectionId, questionId, userId } = ids;
        await this.authorizeAccess({ formId, sectionId, userId });

        const updatedQuestion = await QuestionsModel.findOneAndUpdate(
            { _id: questionId, formId, sectionId },
            { $set: fieldsValidator.getSafeQuestionData(data) },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedQuestion) throw AppError.NotFound('Question not found');
        return updatedQuestion.toJSON();
    }
    async get(ids: Omit<I, 'questionId'>) {
        const { formId, sectionId, userId } = ids;
        await this.authorizeAccess({ formId, sectionId, userId });
        const questions = await QuestionsModel.find({
            formId,
            sectionId,
        }).sort({ index: 1 });

        if (!questions) {
            throw AppError.NotFound('Questions not found');
        }
        return questions?.map((q) => q?.toJSON());
    }

    async getById(ids: I) {
        const { formId, sectionId, userId, questionId } = ids;
        await this.authorizeAccess({ formId, sectionId, userId });
        const question = await QuestionsModel.findOne({
            _id: questionId,
            formId,
            sectionId,
        });
        if (!question) {
            throw AppError.NotFound('Question not found');
        }
        return question.toJSON();
    }

    async reorder(ids: Omit<I, 'questionId'>, order: string[]) {
        const { formId, sectionId, userId } = ids;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await this.authorizeAccess({ formId, sectionId, userId }, session);

            const existing = await QuestionsModel.find({ formId, sectionId })
                .select('_id')
                .session(session)
                .lean();
            const existingIds = new Set(existing.map((q: any) => String(q._id)));
            const incoming = order.map(String);
            if (
                incoming.length !== existingIds.size ||
                new Set(incoming).size !== incoming.length ||
                !incoming.every((id) => existingIds.has(id))
            ) {
                throw AppError.BadRequest(
                    'Reorder must include every question exactly once'
                );
            }

            const operations = [
                ...order.map((questionId, i) => ({
                    updateOne: {
                        filter: { _id: questionId, formId, sectionId },
                        update: { $set: { index: -(i + 1) } },
                    },
                })),
                ...order.map((questionId, index) => ({
                    updateOne: {
                        filter: { _id: questionId, formId, sectionId },
                        update: { $set: { index } },
                    },
                })),
            ];

            await QuestionsModel.bulkWrite(operations, { session });
            await session.commitTransaction();

            return await QuestionsModel.find({ formId, sectionId })
                .sort({ index: 1 })
                .then((questions) => questions?.map((q) => q?.toJSON()));
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async bulkCreate(params: {
        userId: string;
        formId: string;
        sectionId: string;
        data: Question[];
    }) {
        const { formId, sectionId, userId, data: questionsData } = params;
        await this.authorizeAccess({ formId, sectionId, userId });

        const maxDoc = await QuestionsModel.findOne({ sectionId })
            .sort({ index: -1 })
            .select('index')
            .lean();
        const base = (maxDoc?.index ?? -1) + 1;
        const questionsToCreate = questionsData.map((questionData, index) => ({
            formId,
            sectionId,
            ...fieldsValidator.getSafeQuestionData(questionData),
            index: base + index,
        }));
        const createdQuestions =
            await QuestionsModel.insertMany(questionsToCreate);
        return createdQuestions.map((q) => q.toJSON());
    }
}

export default QuestionService;
