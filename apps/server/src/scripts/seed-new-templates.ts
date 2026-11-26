/**
 * Seeds the new Work / Personal and Education templates so the gallery moves
 * beyond intake-and-feedback templates into operational paperwork, everyday
 * personal forms and student workflows.
 *
 * Run with: pnpm run seed:new-templates
 */

import mongoose from 'mongoose';

import { connectDB, disconnectDB } from '@/db/connection';
import TemplateModel from '@/modules/forms/schemas/schemas.template';

const oid = () => new mongoose.Types.ObjectId().toHexString();

const option = (index: number, label: string) => ({ index, label });

const SUBMIT = { type: 'SUBMIT_FORM' as const };

interface SeedSection {
    id: string;
    index: number;
    title: string;
    description?: string;
    defaultAction: { type: 'NEXT_SECTION' | 'GO_TO_SECTION' | 'SUBMIT_FORM' };
}

interface SeedQuestion {
    index: number;
    sectionId: string;
    slug: string;
    question: string;
    type: string;
    isRequired?: boolean;
    helpText?: string;
    placeholder?: string;
    optionsConfig?: {
        options: Array<{
            index: number;
            label: string;
            action?: { type: 'NEXT_SECTION' | 'GO_TO_SECTION' | 'SUBMIT_FORM' };
        }>;
    };
    ratingConfig?: { icon: string; scale: number; lowLabel?: string; highLabel?: string };
    scaleConfig?: { lowerBound: number; upperBound: number; lowerLabel?: string; upperLabel?: string };
    matrixConfig?: {
        rows: Array<{ id: string; label: string }>;
        columns: Array<{ id: string; label: string }>;
        allowMultiplePerColumn?: boolean;
    };
}

async function seedOne(input: {
    name: string;
    description: string;
    category: string;
    isFeatured?: boolean;
    form: Record<string, unknown>;
    sections: SeedSection[];
    questions: SeedQuestion[];
}) {
    const { name, description, category, isFeatured = false, form, sections, questions } =
        input;

    const template = await TemplateModel.findOneAndUpdate(
        { name, category },
        { name, description, category, isFeatured, form, sections, questions },
        {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    console.log(`[seed] ${template?._id.toHexString()} ${name}`);
}

async function main() {
    await connectDB();

    // ─── Work: Leave / Time-Off Request ────────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Leave request', description: 'Tell us about the leave you are requesting.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'employee_name', question: 'Employee name', type: 'TEXT', isRequired: true, placeholder: 'Full name' },
            { index: 1, sectionId: sections[0]!.id, slug: 'department', question: 'Department', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Engineering'), option(1, 'Sales'), option(2, 'HR'), option(3, 'Marketing'), option(4, 'Operations'), option(5, 'Finance'), option(6, 'Support'), option(7, 'Other')] } },
            { index: 2, sectionId: sections[0]!.id, slug: 'leave_type', question: 'Leave type', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Annual'), option(1, 'Sick'), option(2, 'Personal'), option(3, 'Parental'), option(4, 'Unpaid'), option(5, 'Other')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'start_date', question: 'Start date', type: 'DATE', isRequired: true },
            { index: 4, sectionId: sections[0]!.id, slug: 'end_date', question: 'End date', type: 'DATE', isRequired: true },
            { index: 5, sectionId: sections[0]!.id, slug: 'handover_notes', question: 'Handover notes', type: 'PARAGRAPH', isRequired: false, helpText: 'What should the team know before you are away?' },
            { index: 6, sectionId: sections[0]!.id, slug: 'manager_approval', question: 'Manager approval notes', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'Leave / Time-Off Request',
            description: 'Time-off request with department, dates, handover notes and manager approval context.',
            category: 'work',
            isFeatured: true,
            form: { name: 'Leave / Time-Off Request', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true, customConfirmationMessage: 'Thanks for your time-off request. It is now with your manager for review.' } },
            sections,
            questions,
        });
    }

    // ─── Work: Expense Reimbursement Claim ─────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Expense claim', description: 'Record the business expense and how it should be repaid.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'expense_category', question: 'Expense category', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Travel'), option(1, 'Meals'), option(2, 'Office supplies'), option(3, 'Software'), option(4, 'Client entertainment'), option(5, 'Other')] } },
            { index: 1, sectionId: sections[0]!.id, slug: 'expense_date', question: 'Expense date', type: 'DATE', isRequired: true },
            { index: 2, sectionId: sections[0]!.id, slug: 'amount', question: 'Amount', type: 'TEXT', isRequired: true, placeholder: '0.00' },
            { index: 3, sectionId: sections[0]!.id, slug: 'currency', question: 'Currency', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'USD'), option(1, 'EUR'), option(2, 'GBP'), option(3, 'INR'), option(4, 'JPY'), option(5, 'Other')] } },
            { index: 4, sectionId: sections[0]!.id, slug: 'merchant', question: 'Merchant / receipt reference', type: 'TEXT', isRequired: false },
            { index: 5, sectionId: sections[0]!.id, slug: 'business_purpose', question: 'Business purpose', type: 'PARAGRAPH', isRequired: true },
            { index: 6, sectionId: sections[0]!.id, slug: 'reimbursement_method', question: 'Reimbursement method', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Company card'), option(1, 'Personal card'), option(2, 'Bank transfer'), option(3, 'Other')] } },
        ];
        await seedOne({
            name: 'Expense Reimbursement Claim',
            description: 'Business expense claim with category, amount, receipt and purpose.',
            category: 'work',
            isFeatured: true,
            form: { name: 'Expense Reimbursement Claim', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true, customConfirmationMessage: 'Thanks for the expense claim. We will review the receipt and reimburse the approved amount.' } },
            sections,
            questions,
        });
    }

    // ─── Work: Internship / Project Proposal ───────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Project proposal', description: 'Problem, solution, deliverables and timeline for review.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'project_title', question: 'Project title', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'problem_statement', question: 'Problem statement', type: 'PARAGRAPH', isRequired: true },
            { index: 2, sectionId: sections[0]!.id, slug: 'proposed_solution', question: 'Proposed solution', type: 'PARAGRAPH', isRequired: true },
            { index: 3, sectionId: sections[0]!.id, slug: 'deliverables', question: 'Deliverables', type: 'TEXT', isRequired: true, placeholder: 'Comma separated' },
            { index: 4, sectionId: sections[0]!.id, slug: 'timeline', question: 'Timeline', type: 'PARAGRAPH', isRequired: true },
            { index: 5, sectionId: sections[0]!.id, slug: 'resources', question: 'Required resources / tools', type: 'TEXT', isRequired: false },
            { index: 6, sectionId: sections[0]!.id, slug: 'budget', question: 'Budget / funding notes', type: 'TEXT', isRequired: false },
            { index: 7, sectionId: sections[0]!.id, slug: 'success_metrics', question: 'Success metrics', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'Internship / Project Proposal',
            description: 'Internship or project proposal covering problem, solution and deliverables.',
            category: 'work',
            isFeatured: true,
            form: { name: 'Internship / Project Proposal', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true, customConfirmationMessage: 'Proposal received. We will follow up for next steps.' } },
            sections,
            questions,
        });
    }

    // ─── Work: Incident / Bug Report ───────────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Incident report', description: 'Summary, severity and reproduction context for the incident.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'summary', question: 'Summary', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'severity', question: 'Severity / priority', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Critical'), option(1, 'High'), option(2, 'Medium'), option(3, 'Low')] } },
            { index: 2, sectionId: sections[0]!.id, slug: 'environment', question: 'Environment / device', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Web'), option(1, 'iOS'), option(2, 'Android'), option(3, 'API server'), option(4, 'Other')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'steps_to_reproduce', question: 'Steps to reproduce', type: 'PARAGRAPH', isRequired: true },
            { index: 4, sectionId: sections[0]!.id, slug: 'expected_behavior', question: 'Expected behavior', type: 'PARAGRAPH', isRequired: true },
            { index: 5, sectionId: sections[0]!.id, slug: 'actual_behavior', question: 'Actual behavior', type: 'PARAGRAPH', isRequired: true },
            { index: 6, sectionId: sections[0]!.id, slug: 'attachments', question: 'Attachments / links', type: 'TEXT', isRequired: false },
        ];
        await seedOne({
            name: 'Incident / Bug Report',
            description: 'Incident and bug report with severity, environment and reproduction details.',
            category: 'work',
            isFeatured: true,
            form: { name: 'Incident / Bug Report', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true, customConfirmationMessage: 'Incident report received. Our team will triage it.' } },
            sections,
            questions,
        });
    }

    // ─── Work: Invoice / Quotation Request ─────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Invoice / quotation', description: 'Client or vendor details, line items and terms.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'client_name', question: 'Client / vendor name', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'client_email', question: 'Client / vendor email', type: 'TEXT', isRequired: false },
            { index: 2, sectionId: sections[0]!.id, slug: 'line_items', question: 'Line items (name, qty, unit price, amount)', type: 'PARAGRAPH', isRequired: true },
            { index: 3, sectionId: sections[0]!.id, slug: 'tax_gst', question: 'Tax / GST notes', type: 'TEXT', isRequired: false },
            { index: 4, sectionId: sections[0]!.id, slug: 'payment_terms', question: 'Payment terms', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Net 15'), option(1, 'Net 30'), option(2, 'Net 60'), option(3, 'Due on receipt'), option(4, 'Other')] } },
            { index: 5, sectionId: sections[0]!.id, slug: 'currency', question: 'Currency', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'USD'), option(1, 'EUR'), option(2, 'GBP'), option(3, 'INR'), option(4, 'JPY'), option(5, 'Other')] } },
            { index: 6, sectionId: sections[0]!.id, slug: 'po_number', question: 'PO / reference number', type: 'TEXT', isRequired: false },
            { index: 7, sectionId: sections[0]!.id, slug: 'quote_valid_until', question: 'Quote valid until', type: 'DATE', isRequired: false },
        ];
        await seedOne({
            name: 'Invoice / Quotation Request',
            description: 'Invoice or quotation request with client details and line items.',
            category: 'work',
            isFeatured: true,
            form: { name: 'Invoice / Quotation Request', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true, customConfirmationMessage: 'Quotation request received. We will revert with a quote.' } },
            sections,
            questions,
        });
    }

    // ─── Personal: RSVP / Party or Meetup Invite ───────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'RSVP', description: 'Tell us whether you are coming and how many are joining.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'attending', question: 'Will you be attending?', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Yes'), option(1, 'No'), option(2, 'Maybe')] } },
            { index: 1, sectionId: sections[0]!.id, slug: 'guest_count', question: 'Guests (including you)', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, '0'), option(1, '1'), option(2, '2'), option(3, '3'), option(4, '4'), option(5, '5'), option(6, '6+')] } },
            { index: 2, sectionId: sections[0]!.id, slug: 'dietary', question: 'Dietary restrictions', type: 'TEXT', isRequired: false },
            { index: 3, sectionId: sections[0]!.id, slug: 'arrival_window', question: 'Arrival window', type: 'TEXT', isRequired: false, placeholder: 'e.g. 6–8pm' },
            { index: 4, sectionId: sections[0]!.id, slug: 'notes', question: 'Song / activity notes', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'RSVP / Party or Meetup Invite',
            description: 'RSVP, guest count, dietary restrictions and arrival window for a party or meetup.',
            category: 'personal',
            isFeatured: false,
            form: { name: 'RSVP / Party or Meetup Invite', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Personal: Roommate / Shared Expense Split ─────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Shared expenses', description: 'Shared bills, split method and payment due date.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'billing_period', question: 'Billing period', type: 'TEXT', isRequired: true, placeholder: 'e.g. Nov 2026' },
            { index: 1, sectionId: sections[0]!.id, slug: 'shared_bills', question: 'Shared bills (rent, utilities, internet, groceries)', type: 'PARAGRAPH', isRequired: true },
            { index: 2, sectionId: sections[0]!.id, slug: 'split_method', question: 'Split method', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Equal'), option(1, 'By value'), option(2, 'By usage')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'payment_due_date', question: 'Payment due date', type: 'DATE', isRequired: true },
        ];
        await seedOne({
            name: 'Roommate / Shared Expense Split',
            description: 'Roommate shared expense split with bills, method and due date.',
            category: 'personal',
            isFeatured: false,
            form: { name: 'Roommate / Shared Expense Split', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Personal: Volunteer Sign-Up ───────────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Volunteer signup', description: 'Availability, preferred role and needs.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'availability', question: 'Availability', type: 'TEXT', isRequired: true, placeholder: 'e.g. Weekends 9–12' },
            { index: 1, sectionId: sections[0]!.id, slug: 'preferred_role', question: 'Preferred role', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Setup'), option(1, 'Greeter'), option(2, 'Food service'), option(3, 'Cleanup'), option(4, 'Fundraising'), option(5, 'Other')] } },
            { index: 2, sectionId: sections[0]!.id, slug: 'experience', question: 'Prior experience', type: 'TEXT', isRequired: false },
            { index: 3, sectionId: sections[0]!.id, slug: 'emergency_contact', question: 'Emergency contact', type: 'TEXT', isRequired: true },
            { index: 4, sectionId: sections[0]!.id, slug: 'needs', question: 'T-shirt / accessibility needs', type: 'DROP_DOWN', isRequired: false, optionsConfig: { options: [option(0, 'XS'), option(1, 'S'), option(2, 'M'), option(3, 'L'), option(4, 'XL'), option(5, 'Other'), option(6, 'Needs accessibility support')] } },
        ];
        await seedOne({
            name: 'Volunteer Sign-Up',
            description: 'Volunteer availability, preferred role, experience and needs.',
            category: 'personal',
            isFeatured: false,
            form: { name: 'Volunteer Sign-Up', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Personal: Personal Goal / Habit Tracker Intake ────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Habit intake', description: 'Goal, timeframe, baseline and blockers.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'goal', question: 'Target goal', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'timeframe', question: 'Timeframe', type: 'TEXT', isRequired: true, placeholder: 'e.g. 30 days' },
            { index: 2, sectionId: sections[0]!.id, slug: 'baseline', question: 'Current baseline', type: 'PARAGRAPH', isRequired: false },
            { index: 3, sectionId: sections[0]!.id, slug: 'weekly_schedule', question: 'Weekly schedule', type: 'PARAGRAPH', isRequired: false },
            { index: 4, sectionId: sections[0]!.id, slug: 'blockers', question: 'Main blockers', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'Personal Goal / Habit Tracker Intake',
            description: 'Personal goal, habit timeframe, baseline, schedule and blockers.',
            category: 'personal',
            isFeatured: false,
            form: { name: 'Personal Goal / Habit Tracker Intake', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Education: Lab / Assignment Submission Sheet ─────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Submission sheet', description: 'Student details and submission context.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'student_name', question: 'Student name', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'student_id', question: 'Student / record ID', type: 'TEXT', isRequired: true },
            { index: 2, sectionId: sections[0]!.id, slug: 'course_section', question: 'Course / section', type: 'TEXT', isRequired: true },
            { index: 3, sectionId: sections[0]!.id, slug: 'assignment_number', question: 'Assignment / lab number', type: 'TEXT', isRequired: true },
            { index: 4, sectionId: sections[0]!.id, slug: 'submission_notes', question: 'Submission link / notes', type: 'PARAGRAPH', isRequired: false },
            { index: 5, sectionId: sections[0]!.id, slug: 'integrity_declaration', question: 'Academic integrity declaration', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Yes'), option(1, 'No')] } },
        ];
        await seedOne({
            name: 'Lab / Assignment Submission Sheet',
            description: 'Lab or assignment submission sheet with student details and integrity declaration.',
            category: 'education',
            isFeatured: false,
            form: { name: 'Lab / Assignment Submission Sheet', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Education: Workshop / Seminar Registration ───────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Workshop registration', description: 'Participant details and session fit.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'participant_name', question: 'Participant name', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'academic_year', question: 'Academic year', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Freshman'), option(1, 'Sophomore'), option(2, 'Junior'), option(3, 'Senior'), option(4, 'Graduate'), option(5, 'Other')] } },
            { index: 2, sectionId: sections[0]!.id, slug: 'department', question: 'Department', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Computer Science'), option(1, 'Engineering'), option(2, 'Mathematics'), option(3, 'Physics'), option(4, 'Biology'), option(5, 'Business'), option(6, 'Other')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'track', question: 'Track / session', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Technical'), option(1, 'Design'), option(2, 'Research'), option(3, 'Entrepreneurship'), option(4, 'Other')] } },
            { index: 4, sectionId: sections[0]!.id, slug: 'skill_level', question: 'Skill level', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Beginner'), option(1, 'Intermediate'), option(2, 'Advanced'), option(3, 'Expert')] } },
            { index: 5, sectionId: sections[0]!.id, slug: 'speaker_questions', question: 'Questions for the speaker', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'Workshop / Seminar Registration',
            description: 'Workshop or seminar registration with participant and track details.',
            category: 'education',
            isFeatured: false,
            form: { name: 'Workshop / Seminar Registration', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Education: Club / Hackathon Team Registration ─────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Team registration', description: 'Team, members, project idea and stack.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'team_name', question: 'Team name', type: 'TEXT', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'member_details', question: 'Member details / roles', type: 'PARAGRAPH', isRequired: true },
            { index: 2, sectionId: sections[0]!.id, slug: 'project_idea', question: 'Project idea / track', type: 'PARAGRAPH', isRequired: true },
            { index: 3, sectionId: sections[0]!.id, slug: 'tech_stack', question: 'Technical stack', type: 'TEXT', isRequired: false },
            { index: 4, sectionId: sections[0]!.id, slug: 'mentor', question: 'Mentor / equipment needs', type: 'TEXT', isRequired: false },
        ];
        await seedOne({
            name: 'Club / Hackathon Team Registration',
            description: 'Club or hackathon team registration with idea and stack.',
            category: 'education',
            isFeatured: false,
            form: { name: 'Club / Hackathon Team Registration', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Work: Access / Permission Request ──────────────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Access request', description: 'Request system access and approval context.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'requester', question: 'Requester name', type: 'TEXT', isRequired: true, placeholder: 'Full name' },
            { index: 1, sectionId: sections[0]!.id, slug: 'system_resource', question: 'System / resource needing access', type: 'TEXT', isRequired: true, placeholder: 'e.g. CRM admin' },
            { index: 2, sectionId: sections[0]!.id, slug: 'access_level', question: 'Access level', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Read'), option(1, 'Write'), option(2, 'Admin'), option(3, 'Audit')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'justification', question: 'Justification', type: 'PARAGRAPH', isRequired: true },
            { index: 4, sectionId: sections[0]!.id, slug: 'manager_approval', question: 'Manager approval notes', type: 'PARAGRAPH', isRequired: false },
        ];
        await seedOne({
            name: 'Access / Permission Request',
            description: 'Access or permission request with system, level and justification.',
            category: 'work',
            isFeatured: false,
            form: { name: 'Access / Permission Request', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Education: Course Enrollment Registration ─────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Enrollment', description: 'Student course enrollment with term and aid context.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'student_name', question: 'Student name', type: 'TEXT', isRequired: true, placeholder: 'Full name' },
            { index: 1, sectionId: sections[0]!.id, slug: 'course_code', question: 'Course code / name', type: 'TEXT', isRequired: true, placeholder: 'e.g. CS101' },
            { index: 2, sectionId: sections[0]!.id, slug: 'term', question: 'Term', type: 'DROP_DOWN', isRequired: true, optionsConfig: { options: [option(0, 'Fall'), option(1, 'Spring'), option(2, 'Summer'), option(3, 'Winter')] } },
            { index: 3, sectionId: sections[0]!.id, slug: 'credits', question: 'Requested credits', type: 'TEXT', isRequired: false, placeholder: 'e.g. 3' },
            { index: 4, sectionId: sections[0]!.id, slug: 'financial_aid', question: 'Financial aid', type: 'RADIO', isRequired: true, optionsConfig: { options: [option(0, 'Yes'), option(1, 'No')] } },
            { index: 5, sectionId: sections[0]!.id, slug: 'advisor', question: 'Advisor / coordinator', type: 'TEXT', isRequired: false },
        ];
        await seedOne({
            name: 'Course Enrollment Registration',
            description: 'Course enrollment registration with term, credits and aid context.',
            category: 'education',
            isFeatured: false,
            form: { name: 'Course Enrollment Registration', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    // ─── Personal: Moving / Relocation Checklist ───────────────────────────
    {
        const sections: SeedSection[] = [
            { id: oid(), index: 0, title: 'Relocation checklist', description: 'Move date, address, utilities and household logistics.', defaultAction: SUBMIT },
        ];
        const questions: SeedQuestion[] = [
            { index: 0, sectionId: sections[0]!.id, slug: 'move_date', question: 'Move date', type: 'DATE', isRequired: true },
            { index: 1, sectionId: sections[0]!.id, slug: 'new_address', question: 'New address', type: 'TEXT', isRequired: true, placeholder: 'Street, city, country' },
            { index: 2, sectionId: sections[0]!.id, slug: 'utilities_transfer', question: 'Utilities to transfer', type: 'TEXT', isRequired: false, placeholder: 'e.g. electricity, internet' },
            { index: 3, sectionId: sections[0]!.id, slug: 'household_items', question: 'Household items to ship / store', type: 'PARAGRAPH', isRequired: false },
            { index: 4, sectionId: sections[0]!.id, slug: 'forwarding_address', question: 'Forwarding address', type: 'TEXT', isRequired: false },
        ];
        await seedOne({
            name: 'Moving / Relocation Checklist',
            description: 'Relocation checklist covering move date, address, utilities and household logistics.',
            category: 'personal',
            isFeatured: false,
            form: { name: 'Moving / Relocation Checklist', isPrivate: false, isPublished: false, theme: 'purple', settings: { collectEmail: false, allowEditResponse: true, progressBar: true } },
            sections,
            questions,
        });
    }

    await disconnectDB();
}

main().catch(async (error) => {
    console.error('[seed] failed', error);
    await disconnectDB().catch(() => undefined);
    process.exitCode = 1;
});
