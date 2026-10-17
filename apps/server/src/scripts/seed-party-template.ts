import mongoose from 'mongoose';

import { connectDB, disconnectDB } from '@/db/connection';
import TemplateModel from '@/modules/forms/schemas/schemas.template';

const TEMPLATE_NAME = 'Party Invite';
const TEMPLATE_CATEGORY = 'party';

const sectionId = () => new mongoose.Types.ObjectId().toHexString();

async function main() {
    await connectDB();

    const sections = [
        {
            id: sectionId(),
            index: 0,
            title: "You're Invited! 🎉",
            description: 'Tell us if you can make it.',
            defaultAction: { type: 'NEXT_SECTION' as const },
        },
        {
            id: sectionId(),
            index: 1,
            title: 'A few more details',
            description: 'Help us make the party perfect.',
            defaultAction: { type: 'SUBMIT_FORM' as const },
        },
    ];

    const firstSection = sections[0]!;
    const secondSection = sections[1]!;

    const questions = [
        {
            index: 0,
            sectionId: firstSection.id,
            slug: 'full_name',
            question: 'Your name',
            type: 'TEXT',
            isRequired: true,
            placeholder: 'Full name',
        },
        {
            index: 1,
            sectionId: firstSection.id,
            slug: 'attending',
            question: 'Will you be joining us?',
            type: 'RADIO',
            isRequired: true,
            optionsConfig: {
                options: [
                    {
                        index: 0,
                        label: 'Yes, count me in!',
                        action: { type: 'NEXT_SECTION' as const },
                    },
                    {
                        index: 1,
                        label: 'Maybe',
                        action: { type: 'NEXT_SECTION' as const },
                    },
                    {
                        index: 2,
                        label: "Sorry, can't make it",
                        action: { type: 'SUBMIT_FORM' as const },
                    },
                ],
            },
        },
        {
            index: 2,
            sectionId: secondSection.id,
            slug: 'guest_count',
            question: 'How many people are coming (including you)?',
            type: 'DROP_DOWN',
            isRequired: true,
            optionsConfig: {
                options: ['1', '2', '3', '4', '5+'].map((label, index) => ({
                    index,
                    label,
                })),
            },
        },
        {
            index: 3,
            sectionId: secondSection.id,
            slug: 'dietary',
            question: 'Any dietary preferences?',
            type: 'CHOICE',
            isRequired: false,
            helpText: 'Select all that apply',
            optionsConfig: {
                options: [
                    'Vegetarian',
                    'Vegan',
                    'Gluten-free',
                    'Nut allergy',
                    'No restrictions',
                ].map((label, index) => ({ index, label })),
            },
        },
        {
            index: 4,
            sectionId: secondSection.id,
            slug: 'song_request',
            question: 'Song request for the playlist',
            type: 'TEXT',
            isRequired: false,
            placeholder: 'Artist - Song',
        },
        {
            index: 5,
            sectionId: secondSection.id,
            slug: 'note_to_host',
            question: 'Message for the host',
            type: 'PARAGRAPH',
            isRequired: false,
            placeholder: 'Say something nice (or silly)',
        },
    ];

    const template = await TemplateModel.findOneAndUpdate(
        { name: TEMPLATE_NAME, category: TEMPLATE_CATEGORY },
        {
            name: TEMPLATE_NAME,
            description:
                "You're invited! Join us for an evening of food, music and fun. Saturday, 7:00 PM onwards at [Venue / Address]. Please reply so we can plan.",
            category: TEMPLATE_CATEGORY,
            isFeatured: false,
            form: {
                name: TEMPLATE_NAME,
                isPrivate: false,
                isPublished: false,
                theme: 'purple',
                settings: {
                    collectEmail: false,
                    allowEditResponse: true,
                    progressBar: true,
                    customConfirmationMessage:
                        "Thanks for replying! Can't wait to celebrate with you.",
                },
            },
            sections,
            questions,
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    console.log(`[seed] ${template?._id.toHexString()} ${TEMPLATE_NAME}`);
    await disconnectDB();
}

main().catch(async (error) => {
    console.error('[seed] failed', error);
    await disconnectDB().catch(() => undefined);
    process.exitCode = 1;
});
