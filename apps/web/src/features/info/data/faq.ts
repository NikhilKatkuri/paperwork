import { siteConfig } from '@/config/site';

export interface FaqLink {
    label: string;
    href: string;
    /** External links open in a new tab and are rendered with rel="noopener". */
    external?: boolean;
}

export interface FaqItem {
    id: string;
    question: string;
    paragraphs?: string[];
    bullets?: string[];
    links?: FaqLink[];
}

export interface FaqCategory {
    id: string;
    title: string;
    description: string;
    /** Material Symbols icon name (the font is already loaded app-wide). */
    icon: string;
    items: FaqItem[];
}

/**
 * Help Center content.
 *
 * Only document behaviour that exists in the codebase today. Known settings
 * that are stored but not yet enforced or rendered by the fill flow —
 * `collectEmail`, `progressBar`, `shuffleQuestions`, `allowEditResponse`,
 * `saveAndContinueLater`, `customConfirmationMessage`, `redirectUrl` and
 * `timeLimitPerResponse` — are intentionally not described here.
 */
export const faqCategories: FaqCategory[] = [
    {
        id: 'getting-started',
        title: 'Getting started',
        description: 'Create, edit, publish and share forms.',
        icon: 'rocket_launch',
        items: [
            {
                id: 'what-is-paperwork',
                question: 'What is Paperwork?',
                paragraphs: [
                    'Paperwork is an open-source form builder and response collection app. You define a form as sections and questions, publish it, and collect responses from people who fill it in.',
                    'The source code is available on GitHub, and the same codebase can be self-hosted.',
                ],
                links: [
                    {
                        label: 'View the repository',
                        href: siteConfig.repositoryUrl,
                        external: true,
                    },
                ],
            },
            {
                id: 'create-a-form',
                question: 'How do I create a form?',
                paragraphs: [
                    'Sign in to your account and open the dashboard. Creating a form opens the editor, where you can add sections and questions and change the form settings.',
                    'Questions cover text, paragraphs, choice checkboxes, single-choice radio buttons, drop-downs, linear scales, rating scales, dates, times and matrices. Each question can be marked as required and given validation rules.',
                ],
            },
            {
                id: 'how-changes-are-saved',
                question: 'How are my form changes saved?',
                paragraphs: [
                    'The editor saves your work automatically. While you type, changes are stored in your browser and synced to the server in the background, so you can keep working if the connection drops for a moment.',
                    'Publishing waits for pending changes to finish syncing. If a change is not saved yet, publishing asks you to retry instead of publishing a stale version.',
                ],
            },
            {
                id: 'publish-a-form',
                question: 'How do I publish a form?',
                paragraphs: [
                    'Use the Publish control in the editor. A form must have a name, at least one section and at least one question before it can be published.',
                    'You can unpublish a form at any time. While a form is unpublished, respondents cannot open or submit it.',
                ],
            },
            {
                id: 'share-a-form',
                question: 'How do I share a form?',
                paragraphs: [
                    'Published forms are served at /forms/v/<form-id>. You can find the form id in the editor URL, which looks like /forms/c/<form-id>.',
                    'Respondents need a Paperwork account: opening a form link requires signing in, and submissions are stored against that account (plus any email address the form asks for). The current version does not include a built-in share or copy-link button, so share the URL directly.',
                ],
            },
        ],
    },
    {
        id: 'responding',
        title: 'Responding to forms',
        description: 'Fill in a form and troubleshoot submissions.',
        icon: 'edit_note',
        items: [
            {
                id: 'fill-and-submit',
                question: 'How do I complete and submit a form?',
                paragraphs: [
                    'Open the form link while signed in to your Paperwork account. If the form has multiple sections, you move through them one step at a time using the Next button; the last step submits your answers.',
                    'After a successful submission the confirmation screen appears and a confirmation email is sent to your account address (or the address you entered if the form asked for one). A copy of your submission remains visible to the form owner in their responses.',
                ],
            },
            {
                id: 'required-and-validation',
                question: 'What do required fields and validation errors mean?',
                paragraphs: [
                    'Questions marked as required must be answered before you can continue. Validation rules check the format of your answers — for example an email address, a URL, a number range, a minimum or maximum length, a date order, or a required number of selections.',
                    'When an answer fails a rule, the field is highlighted with an explanatory message. Correct the answer and continue.',
                ],
            },
            {
                id: 'conditional-questions',
                question:
                    'Why do some questions or sections appear only sometimes?',
                paragraphs: [
                    'Form creators can configure conditional logic. Questions can depend on earlier answers, and sections can branch, jump or submit based on the answers given. If a section you expected is missing, it usually means an earlier answer did not match its conditions.',
                ],
            },
            {
                id: 'submission-failed',
                question: 'My submission failed. What should I do?',
                paragraphs: [
                    'Check for highlighted validation errors first, then try again. The most common causes are:',
                ],
                bullets: [
                    'Your session expired — sign in again and reopen the form.',
                    'The form is not published, has not opened yet, or has closed.',
                    'The form reached its maximum number of responses, or you already reached the per-user limit.',
                    'The form restricts access to specific email domains and your account does not match.',
                    'A temporary network problem — waiting a moment and resubmitting is safe. Duplicate submissions are detected, so retrying never creates extra responses.',
                ],
            },
        ],
    },
    {
        id: 'forms-and-responses',
        title: 'Forms and responses',
        description: 'Manage your forms and review collected responses.',
        icon: 'inventory_2',
        items: [
            {
                id: 'manage-forms',
                question: 'Where do I find and manage my forms?',
                paragraphs: [
                    'Your dashboard lists the forms you own and includes search, recent templates, grid and row views. From a form you can open the editor, duplicate it, publish or unpublish it, and delete it.',
                ],
            },
            {
                id: 'view-responses',
                question: 'How do I view responses?',
                paragraphs: [
                    'Open a form and switch to its Responses view. You can browse the list of responses, see per-question summaries, and open an individual response for detail. Form owners can also export responses as a CSV file; the export contains the respondent email, submission time and one column per question.',
                ],
            },
            {
                id: 'response-limits',
                question: 'Why does the form say it is closed or full?',
                paragraphs: [
                    'A form can be limited to a maximum number of responses in total and per respondent, and it can have start and close dates. When a limit is reached or the closing date passes, the form stops accepting submissions until the owner changes the settings. Private forms and forms restricted to certain email domains are also invisible to respondents who do not match.',
                ],
            },
            {
                id: 'delete-a-form',
                question: 'What happens when I delete a form?',
                paragraphs: [
                    'Deleting a form removes the form, its sections and its questions from your account. Responses that were already collected are not deleted automatically by the current version — if you need previously collected answers erased, contact the maintainers so it can be handled manually.',
                ],
                links: [
                    { label: 'Contact & support', href: '/contact' },
                    { label: 'Privacy Policy', href: '/privacy' },
                ],
            },
        ],
    },
    {
        id: 'privacy-and-security',
        title: 'Privacy and security',
        description:
            'What is stored, and how to raise privacy or security concerns.',
        icon: 'shield',
        items: [
            {
                id: 'what-data-is-stored',
                question: 'What information does Paperwork store about me?',
                paragraphs: [
                    'Accounts store your email address and a hashed password, plus any optional profile details you add. Submissions store your answers, your email address, the IP address and browser user-agent recorded with the submission, and timestamps. Technical request logs record similar connection details for security and debugging.',
                    'The Privacy Policy describes each category, the cookies and browser storage used, and the third-party services involved.',
                ],
                links: [{ label: 'Read the Privacy Policy', href: '/privacy' }],
            },
            {
                id: 'request-data-deletion',
                question: 'How do I request deletion of my data?',
                paragraphs: [
                    'Account settings include a delete-account action. It flags the account for deletion and blocks sign-in after a 30-day window; signing in before then cancels the request. The current version does not automatically erase stored data, so if you need your data actually removed, open a request through the contact channels and the maintainers will handle it.',
                ],
                links: [{ label: 'Contact & support', href: '/contact' }],
            },
            {
                id: 'report-security-issue',
                question: 'How do I report a security issue?',
                paragraphs: [
                    'Please do not post exploit details, tokens, passwords or private data in public issues. Contact the maintainer first so a private channel can be arranged, and include only a short summary publicly if you need to open an issue at all.',
                ],
                links: [
                    { label: 'Security reporting guidance', href: '/contact' },
                ],
            },
        ],
    },
    {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Common problems and how to fix them.',
        icon: 'build',
        items: [
            {
                id: 'form-not-loading',
                question: 'A form will not load.',
                bullets: [
                    'Make sure you are signed in — form links require an account.',
                    'The form may be unpublished, not open yet, closed, or full.',
                    'Private forms and domain-restricted forms are only visible to matching users.',
                    'Reload the page; if the problem persists, report it with the form id and the error message shown.',
                ],
                links: [{ label: 'Report a problem', href: '/contact' }],
            },
            {
                id: 'publishing-failure',
                question: 'Publishing fails.',
                bullets: [
                    'Give the form a name and add at least one section and one question.',
                    'If the editor still has unsaved changes, wait for the sync indicator and retry.',
                    'If the error continues, retry once more and then report it with the exact message.',
                ],
                links: [{ label: 'Report a problem', href: '/contact' }],
            },
            {
                id: 'submission-errors',
                question: 'I cannot submit my answers.',
                bullets: [
                    'Fix any highlighted validation errors.',
                    'If your session expired, sign in again and reopen the form.',
                    'If the form has closed or reached a response limit, contact the form owner.',
                    'Retrying is safe — duplicate submissions are detected and do not create extra responses.',
                ],
            },
            {
                id: 'email-problems',
                question: 'I am not receiving emails.',
                paragraphs: [
                    'Paperwork sends transactional email only: sign-in alerts, verification codes, password reset links and submission confirmations. Depending on how the instance is deployed, mail is delivered through an SMTP server or the Resend email service.',
                    'Check your spam folder first. If nothing arrives, confirm the address on your account is correct, and ask the operator of the instance you are using to check its mail configuration. Delivery cannot be guaranteed by the application itself.',
                ],
            },
        ],
    },
];

export default faqCategories;
