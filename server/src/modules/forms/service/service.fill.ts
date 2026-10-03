import mongoose from 'mongoose';
import { AppError } from '@/utils/AppError';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import FormResponseModel from '@/modules/forms/schemas/schemas.fill';
import { ResponseCore } from '@/types/form/forms';
import { FormDocument, QuestionDocument } from '@/types/form/Document';
import FileService from '@/modules/forms/service/service.internal.file';

export interface ResponseQuery {
    search?: string;
    questionId?: string;
    sort?: 'newest' | 'oldest';
}

/** Escape a user string before using it inside a `$regex`. */
function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the `$match` for the response list.
 *
 * Search is case-insensitive across the respondent email and any answer value.
 * `questionId` restricts to responses that answered that question.
 */
function buildResponseMatch(
    formId: string,
    options: ResponseQuery = {}
): Record<string, any> {
    const match: Record<string, any> = { formId };

    if (options.questionId) {
        match['answers.questionId'] = options.questionId;
    }

    const search = options.search?.trim();

    if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');

        match.$or = [{ email: pattern }, { 'answers.values': pattern }];
    }

    return match;
}

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
        const { formId, userId, email, answers, metadata } = data;
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
                { session, returnDocument: 'after' }
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
                        metadata,
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

    async responses(
        formId: string,
        page: number = 1,
        limit: number = 20,
        options: ResponseQuery = {}
    ) {
        const form = await FormsModel.findById(formId).lean();
        if (!form) throw AppError.FormNotFound('Form not found');

        // Bounded again here so a caller bypassing validation cannot ask for
        // the whole collection in one page.
        const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 20), 100);
        const safePage = Math.max(1, Math.trunc(page) || 1);
        const skip = (safePage - 1) * safeLimit;

        const result = await FormResponseModel.aggregate([
            { $match: buildResponseMatch(formId.toString(), options) },
            {
                $facet: {
                    data: [
                        {
                            $sort: {
                                createdAt: options.sort === 'oldest' ? 1 : -1,
                            },
                        },
                        { $skip: skip },
                        { $limit: safeLimit },
                        { $project: { __v: 0, updatedAt: 0 } },
                    ],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const responses = result[0]?.data ?? [];
        const total = result[0]?.totalCount[0]?.count || 0;

        return {
            responses,
            pagination: {
                currentPage: safePage,
                totalPages: Math.ceil(total / safeLimit),
                total,
                limit: safeLimit,
            },
        };
    }

    /**
     * Per-question totals across every response, not just one page, so the
     * summary does not change as the user pages through the list.
     */
    async responsesSummary(formId: string, options: ResponseQuery = {}) {
        const form = await FormsModel.findById(formId).lean();
        if (!form) throw AppError.FormNotFound('Form not found');

        const match = buildResponseMatch(formId.toString(), options);

        const [totalResponses, breakdown] = await Promise.all([
            FormResponseModel.countDocuments(match),
            FormResponseModel.aggregate([
                { $match: match },
                { $unwind: '$answers' },
                { $unwind: '$answers.values' },
                {
                    $group: {
                        _id: {
                            questionId: '$answers.questionId',
                            value: '$answers.values',
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const byQuestion = new Map<
            string,
            { answered: number; values: { value: string; count: number }[] }
        >();

        breakdown.forEach((row: any) => {
            const { questionId, value } = row._id;
            const entry = byQuestion.get(questionId) ?? {
                answered: 0,
                values: [],
            };

            entry.values.push({ value, count: row.count });
            entry.answered += row.count;
            byQuestion.set(questionId, entry);
        });

        const questions = [...byQuestion.entries()].map(
            ([questionId, entry]) => ({
                questionId,
                answered: entry.answered,
                // Most-answered first so the summary reads top-down.
                values: entry.values.sort((a, b) => b.count - a.count),
            })
        );

        return { totalResponses, questions };
    }

    async getResponse(formId: string, responseId: string) {
        const form = await FormsModel.findById(formId).lean();
        if (!form) throw AppError.FormNotFound('Form not found');

        const response = await FormResponseModel.find({
            _id: responseId,
            formId,
        })
            .select('-__v -updatedAt')
            .lean();
        if (!response) throw AppError.ResponseNotFound('Response not found');

        return response;
    }

    async exportResponses(formId: string, exportType: string) {
        try {
            const form = await FormsModel.findById(formId).lean();
            if (!form) throw AppError.FormNotFound('Form not found');
            const questions = (await QuestionsModel.find({
                formId,
            })) as QuestionDocument[];
            if (!questions.length)
                throw AppError.QuestionNotFound(
                    'No questions found for this form'
                );
            const responses = await FormResponseModel.find({ formId })
                .sort({ createdAt: -1 })
                .select('-__v -updatedAt')
                .lean();

            if (responses.length === 0) {
                throw AppError.BadRequest('No responses to export');
            }

            const fileService = new FileService();
            const questionIdMap = new Map<string, string>();
            questions.forEach((q) =>
                questionIdMap.set(q._id.toString(), q.question)
            );

            const headers = questions.map((q) => q.question);
            let i = '';

            switch (exportType.toLowerCase()) {
                case 'csv':
                    i = await fileService.CSVExport(
                        headers,
                        questionIdMap,
                        responses
                    );
                    break;
                default:
                    throw AppError.BadRequest('Unsupported export type');
            }
            return i;
        } catch (error) {
            throw AppError.Internal('Export failed');
        }
    }
}

export default FillService;
