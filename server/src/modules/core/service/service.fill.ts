import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/core/schemas/schemas.forms';
import SectionModel from '@/modules/core/schemas/schemas.sections';
import QuestionsModel from '@/modules/core/schemas/schemas.questions';
import FormResponseModel from '@/modules/core/schemas/schemas.responses';
import { ResponseCore } from '@/types/form/forms';
import { FormDocument } from '@/types/form/Document';

class FillService {
    private validateEmailDomain(
        email: string,
        allowedDomains: string[]
    ): boolean {
        if (!allowedDomains || allowedDomains.length === 0) return true;

        const domain = email.split('@')[1]?.toLowerCase();

        if (
            !domain ||
            !allowedDomains.map((d) => d.toLowerCase()).includes(domain)
        ) {
            throw AppError.Forbidden(
                `Access restricted. Authorized domains: ${allowedDomains.join(', ')}`
            );
        }
        return true;
    }

    async verifier(form: FormDocument, userId: string, email?: string) {
        if (!form || form.isPrivate)
            throw AppError.FormNotFound('Form not found');
        if (!form.isPublished)
            throw AppError.FormNotPublished('Form is not published');

        if (form.allowedDomains && form.allowedDomains.length > 0) {
            const target = email || userId;
            this.validateEmailDomain(target, form.allowedDomains);
        }

        const now = new Date();
        if (form.settings?.startDate && now < form.settings.startDate) {
            throw AppError.FormNotOpen('Form is not yet open');
        }
        if (form.settings?.closeDate && now > form.settings.closeDate) {
            throw AppError.FormClosed('Form is closed');
        }

        if (form.settings?.maxResponses && form.responseCount !== undefined) {
            if (form.responseCount >= form.settings.maxResponses) {
                throw AppError.FormClosed('Maximum response limit reached');
            }
        }

        if (form.settings?.maxResponsesPerUser && userId) {
            const userCount = await FormResponseModel.countDocuments({
                formId: form._id.toString(),
                userId,
            });
            if (userCount >= form.settings.maxResponsesPerUser) {
                throw AppError.FormClosed('User submission limit reached');
            }
        }
    }

    async get(formId: string, userId: string, email?: string) {
        const form = (await FormsModel.findById(formId)
            .select('-__v')
            .lean()) as FormDocument;

        await this.verifier(form, userId, email);

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
            throw AppError.SectionNotFound('Form has no content');

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
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const updatedForm = await FormsModel.findOneAndUpdate(
                {
                    _id: formId,
                    $or: [
                        { 'settings.maxResponses': { $exists: false } },
                        {
                            $expr: {
                                $lt: [
                                    '$responseCount',
                                    '$settings.maxResponses',
                                ],
                            },
                        },
                    ],
                },
                { $inc: { responseCount: 1 } },
                { session, new: true }
            ).lean();

            if (!updatedForm) {
                throw AppError.BadRequest(
                    'Response limit reached or form unavailable'
                );
            }

            await this.verifier(updatedForm as FormDocument, userId, email);

            const validQuestionIds = await QuestionsModel.find({ formId })
                .distinct('_id')
                .session(session);

            const validIdStrings = validQuestionIds.map((id) => id.toString());
            const isDataValid = answers.every((ans) =>
                validIdStrings.includes(ans.questionId.toString())
            );

            if (!isDataValid) throw AppError.BadRequest('Invalid questions');

            const response = await FormResponseModel.create(
                [
                    {
                        formId,
                        userId,
                        email,
                        answers,
                    },
                ],
                { session }
            );

            await session.commitTransaction();
            return response[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default FillService;
