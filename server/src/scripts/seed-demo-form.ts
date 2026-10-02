/**
 * Seeds a published demo form so the fill UI can be exercised end to end.
 *
 * Every question type, a mix of required and optional, and the validation rules
 * the fill view enforces, spread across three sections with different navigation
 * behaviour (next / jump / submit).
 *
 * Run with: pnpm run seed:demo
 * Set SEED_USER_ID to target a specific user; otherwise the first user is used.
 * Forms left by previous runs are removed so repeated runs do not pile up.
 */

import mongoose from 'mongoose';

import { connectDB, disconnectDB } from '@/db/connection';
import FormsService from '@/modules/forms/service/service.forms';
import FormsModel from '@/modules/forms/schemas/schemas.forms';
import SectionModel from '@/modules/forms/schemas/schemas.sections';
import QuestionsModel from '@/modules/forms/schemas/schemas.questions';
import UserModel from '@/modules/auth/schemas/user.schema';
import type { FormDocument } from '@/types/form/Document';

const DEMO_NAME = 'Customer feedback (demo)';

const oid = () => new mongoose.Types.ObjectId();

const option = (index: number, label: string) => ({ index, label });

async function main() {
    await connectDB();

    try {
        const rawUserId =
            process.env.SEED_USER_ID ??
            (await UserModel.findOne().select('_id').lean())?._id?.toString();

        if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
            throw new Error(
                'No valid user found. Create an account first, or set SEED_USER_ID.'
            );
        }

        // The schema types these fields as strings.
        const userId = String(rawUserId);

        console.log(`[seed] seeding for user ${userId}`);

        // Keep repeat runs tidy - only forms this script created.
        const previous = await FormsModel.find({ name: DEMO_NAME }).select(
            '_id'
        );

        if (previous.length) {
            const ids = previous.map((f) => f._id);
            // `formId` is typed as a string on the section/question models.
            const formIds = ids.map((id) => id.toString());

            await Promise.all([
                SectionModel.deleteMany({ formId: { $in: formIds } }),
                QuestionsModel.deleteMany({ formId: { $in: formIds } }),
                FormsModel.deleteMany({ _id: { $in: ids } }),
            ]);

            console.log(`[seed] removed ${ids.length} previous demo form(s)`);
        }

        const created = (
            await FormsModel.create([
                {
                    userId,
                    name: DEMO_NAME,
                    isPrivate: false,
                    isPublished: false,
                    settings: {
                        progressBar: true,
                        collectEmail: false,
                        shuffleQuestions: false,
                        allowEditResponse: false,
                        saveAndContinueLater: false,
                    },
                },
            ])
        )[0] as unknown as FormDocument | undefined;

        if (!created) throw new Error('Failed to create the demo form');

        const formId = created._id;

        const aboutYou = oid();
        const experience = oid();
        const details = oid();

        const q = {
            name: oid(),
            email: oid(),
            channels: oid(),
            rating: oid(),
            recommend: oid(),
            wentWell: oid(),
            problems: oid(),
            reference: oid(),
            website: oid(),
            teamSize: oid(),
            followUp: oid(),
            contactTime: oid(),
            satisfaction: oid(),
        };

        /**
         * Written through the service so the demo data is produced by exactly
         * the same validation and write path the editor uses.
         */
        const payload = {
            name: DEMO_NAME,
            isPrivate: false,
            // Published up front: GET /forms/:id/fill refuses unpublished forms.
            isPublished: true,
            allowedDomains: [],
            settings: {
                progressBar: true,
                collectEmail: false,
                shuffleQuestions: false,
                allowEditResponse: false,
                saveAndContinueLater: false,
            },
            sections: [
                {
                    _id: aboutYou,
                    index: 0,
                    title: 'About you',
                    description:
                        'A few details before we get to the good part.',
                },
                {
                    _id: experience,
                    index: 1,
                    title: 'Your experience',
                    description: 'Tell us how it went.',
                    // Exercises the jump-to-section path in the fill view.
                    defaultAction: {
                        actionType: 'GO_TO_SECTION',
                        sectionId: details,
                    },
                },
                {
                    _id: details,
                    index: 2,
                    title: 'Final details',
                    description: 'Last section - this one submits.',
                    defaultAction: { actionType: 'SUBMIT_FORM' },
                },
            ],
            questions: [
                {
                    _id: q.name,
                    index: 0,
                    sectionId: aboutYou,
                    type: 'TEXT',
                    question: 'Your name',
                    isRequired: true,
                },
                {
                    _id: q.email,
                    index: 1,
                    sectionId: aboutYou,
                    type: 'TEXT',
                    question: 'Email address',
                    helpText: 'Optional - only if you want a reply.',
                    validationRule: { ruleType: 'EMAIL' },
                },
                {
                    _id: q.channels,
                    index: 2,
                    sectionId: aboutYou,
                    type: 'CHOICE',
                    question: 'How did you hear about us?',
                    isRequired: true,
                    optionsConfig: {
                        options: [
                            option(0, 'Search engine'),
                            option(1, 'A friend'),
                            option(2, 'Social media'),
                            option(3, 'Somewhere else'),
                        ],
                    },
                    validationRule: {
                        ruleType: 'CHECKBOX_MIN_SELECT',
                        value: 1,
                    },
                },
                {
                    _id: q.rating,
                    index: 0,
                    sectionId: experience,
                    type: 'RATING',
                    question: 'How would you rate our service?',
                    isRequired: true,
                    ratingConfig: { icon: 'STAR', scale: 5 },
                },
                {
                    _id: q.recommend,
                    index: 1,
                    sectionId: experience,
                    type: 'LINEAR_SCALE',
                    question: 'How likely are you to recommend us?',
                    isRequired: true,
                    ratingConfig: {
                        icon: 'STAR',
                        scale: 10,
                        lowLabel: 'Not likely',
                        highLabel: 'Very likely',
                    },
                },
                {
                    _id: q.wentWell,
                    index: 2,
                    sectionId: experience,
                    type: 'PARAGRAPH',
                    question: 'What went well?',
                    helpText: 'At least 10 characters.',
                    validationRule: { ruleType: 'MIN_CHAR_COUNT', value: 10 },
                },
                {
                    _id: q.problems,
                    index: 3,
                    sectionId: experience,
                    type: 'RADIO',
                    question: 'Did you run into any problems?',
                    isRequired: true,
                    optionsConfig: {
                        options: [option(0, 'Yes'), option(1, 'No')],
                    },
                },
                {
                    _id: q.reference,
                    index: 0,
                    sectionId: details,
                    type: 'TEXT',
                    question: 'Reference code',
                    helpText: 'Format: ABC-1234',
                    placeholder: 'ABC-1234',
                    validationRule: {
                        ruleType: 'REGEX_MATCH',
                        pattern: '^[A-Z]{3}-\\d{4}$',
                    },
                },
                {
                    _id: q.website,
                    index: 1,
                    sectionId: details,
                    type: 'TEXT',
                    question: 'Your website',
                    validationRule: { ruleType: 'URL' },
                },
                {
                    _id: q.teamSize,
                    index: 2,
                    sectionId: details,
                    type: 'TEXT',
                    question: 'How many people are on your team?',
                    validationRule: {
                        ruleType: 'NUMBER_BETWEEN',
                        min: 1,
                        max: 500,
                    },
                },
                {
                    _id: q.followUp,
                    index: 3,
                    sectionId: details,
                    type: 'DATE',
                    question: 'Preferred follow-up date',
                },
                {
                    _id: q.contactTime,
                    index: 4,
                    sectionId: details,
                    type: 'TIME',
                    question: 'Preferred contact time',
                },
                {
                    _id: q.satisfaction,
                    index: 5,
                    sectionId: details,
                    type: 'DROP_DOWN',
                    question: 'Overall satisfaction',
                    isRequired: true,
                    optionsConfig: {
                        options: [
                            option(0, 'Very satisfied'),
                            option(1, 'Satisfied'),
                            option(2, 'Neutral'),
                            option(3, 'Unsatisfied'),
                        ],
                    },
                },
            ],
        } as unknown as Parameters<FormsService['bulkPut']>[0];

        const result = await new FormsService().bulkPut(
            payload,
            userId,
            formId.toString()
        );

        const formIdStr = formId.toString();
        const sections = await SectionModel.countDocuments({
            formId: formIdStr,
        });
        const questions = await QuestionsModel.countDocuments({
            formId: formIdStr,
        });

        console.log('\n[seed] done');
        console.log(`[seed] formId   : ${formIdStr}`);
        console.log(`[seed] published : ${Boolean(result?.isPublished)}`);
        console.log(`[seed] sections  : ${sections}`);
        console.log(`[seed] questions : ${questions}`);
        console.log(`\n[seed] open  /forms/v/${formIdStr}\n`);
    } finally {
        await disconnectDB();

        /**
         * Importing the service pulls in the Redis-backed QueueManager, whose
         * open handles keep the event loop alive after the database closes -
         * without this the script would hang forever after printing its result.
         */
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('[seed] failed:', error);
    process.exit(1);
});
