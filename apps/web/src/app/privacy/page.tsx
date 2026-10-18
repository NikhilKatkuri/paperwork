import type { Metadata } from 'next';
import InfoPageShell, {
    type TocItem,
} from '@/features/info/components/InfoPageShell';
import {
    InfoList,
    InfoSection,
    InfoTable,
} from '@/features/info/components/InfoSection';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
    title: `${siteConfig.name} | Privacy Policy`,
    description:
        'How Paperwork collects, uses, stores and deletes data, including cookies, browser storage, email delivery and third-party services.',
};

const toc: TocItem[] = [
    { id: 'scope', label: 'Scope' },
    { id: 'data-we-collect', label: 'Data we collect' },
    { id: 'how-we-use-data', label: 'How we use data' },
    { id: 'cookies-and-storage', label: 'Cookies and device storage' },
    { id: 'email', label: 'Email we send' },
    { id: 'third-parties', label: 'Third-party services' },
    { id: 'retention', label: 'Retention and deletion' },
    { id: 'your-choices', label: 'Your choices' },
    { id: 'form-creators', label: 'For form creators' },
    { id: 'security', label: 'Security' },
    { id: 'changes', label: 'Changes to this policy' },
    { id: 'contact', label: 'Contact' },
];

const linkClass =
    'rounded-md text-brand-depth font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function PrivacyPolicyPage() {
    return (
        <InfoPageShell
            title="Privacy Policy"
            intro="This policy explains what data Paperwork collects, why it is collected, where it is stored and how you can ask for it to be accessed, corrected or deleted. It describes the application as it is implemented today — no more and no less."
            toc={toc}
        >
            <InfoSection id="scope" title="Scope">
                <p>
                    Paperwork is an open-source form builder and response
                    collection application. The source code is public and can be
                    self-hosted, which means the same application can run in
                    many places.
                </p>
                <InfoList
                    items={[
                        'This policy applies to the hosted instance you are using and to the Paperwork application itself.',
                        'If you are using a self-hosted deployment, the person or organization operating that deployment controls the data stored in it and is responsible for this policy. The Paperwork project does not have access to self-hosted data.',
                        'This document does not cover GitHub. If you open an issue or comment on the repository, GitHub processes that content under GitHub\u2019s own terms and privacy policy.',
                    ]}
                />
                <p>
                    The hosted instance details an operator would normally
                    publish — operator name, hosting region and backup policy —
                    are not yet documented in the repository. Ask the
                    maintainers through the{' '}
                    <a href="/contact" className={linkClass}>
                        contact channels
                    </a>{' '}
                    if you need them before relying on this deployment.
                </p>
            </InfoSection>

            <InfoSection id="data-we-collect" title="Data we collect">
                <InfoList
                    items={[
                        <>
                            <strong>Account data.</strong> Your email address
                            and a password hash (passwords are never stored in
                            plain text), plus whether your email has been
                            verified and whether two-factor authentication is
                            enabled.
                        </>,
                        <>
                            <strong>Optional profile data.</strong> A display
                            name and, if you add them, an avatar image, a short
                            bio, and optional personal details such as date of
                            birth, gender, country and language.
                        </>,
                        <>
                            <strong>Form content.</strong> The forms you create:
                            names, sections, questions, settings, publish state
                            and themes.
                        </>,
                        <>
                            <strong>Responses.</strong> The answers submitted to
                            a form, the respondent&rsquo;s email address, the IP
                            address and browser user-agent recorded with the
                            submission, and timestamps.
                        </>,
                        <>
                            <strong>Email queue records.</strong> Messages the
                            application sends are queued first; the queue stores
                            the recipient address and message content (including
                            verification codes and password-reset links) until
                            the message is sent and purged.
                        </>,
                        <>
                            <strong>Technical logs.</strong> Request logs record
                            connection details such as IP address, user-agent,
                            requested path, status and duration for security,
                            abuse prevention and debugging. In production,
                            request bodies are not logged by default; when body
                            logging is enabled, sensitive fields are redacted
                            first.
                        </>,
                        <>
                            <strong>Support messages.</strong> Anything you post
                            in GitHub issues or comments lives on GitHub, not in
                            Paperwork.
                        </>,
                    ]}
                />
            </InfoSection>

            <InfoSection id="how-we-use-data" title="How we use data">
                <InfoList
                    items={[
                        'To create and secure accounts, including sign-in alerts and optional two-factor authentication.',
                        'To render, publish and share forms, and to store and show responses to the form owner.',
                        'To send transactional email: verification codes, password resets, security alerts and submission confirmations.',
                        'To detect and limit abuse — rate limiting, disposable-email blocking, response limits and suspicious-activity logging.',
                        'To operate, debug and improve the application.',
                    ]}
                />
                <p>
                    Data is used to run the service you asked for. It is not
                    sold, and the application contains no advertising or
                    behavioural analytics.
                </p>
            </InfoSection>

            <InfoSection
                id="cookies-and-storage"
                title="Cookies and device storage"
            >
                <p>
                    Cookies are issued by the API server for authentication and
                    short-lived verification state. The web app also stores
                    drafts and caches in your browser so the editor keeps
                    working across reloads and brief connection drops.
                </p>
                <InfoTable
                    headers={['Name', 'Where', 'Purpose', 'Lifetime']}
                    rows={[
                        [
                            'refreshToken',
                            'HTTP-only cookie',
                            'Keeps you signed in; read by the server, never by JavaScript',
                            'About 7 days',
                        ],
                        [
                            'tempAccessToken, Expiry2faAt',
                            'Cookies',
                            'Two-factor sign-in challenge state',
                            'About 5 minutes',
                        ],
                        [
                            'emailVerification',
                            'Cookie',
                            'Email verification window',
                            'About 5 minutes',
                        ],
                        [
                            'email_check_cache',
                            'Cookie',
                            'Remembers a registration availability check using a hash of the email address',
                            'About 10 minutes',
                        ],
                        [
                            'IndexedDB stores',
                            'Browser storage',
                            'Form drafts and unsynced editor changes so work survives reloads',
                            'Until cleared or signed out',
                        ],
                        [
                            'pw:storage:* keys, theme and search caches',
                            'localStorage / IndexedDB',
                            'Profile, account and preferences caches to avoid refetching; cleared on sign-out where applicable',
                            'Minutes to days',
                        ],
                    ]}
                />
                <p>
                    There are no tracking or advertising cookies, and no
                    third-party analytics scripts. Your access token is kept in
                    memory only and is not written to browser storage.
                </p>
            </InfoSection>

            <InfoSection id="email" title="Email we send">
                <p>
                    Email is transactional and limited to: account verification
                    codes, welcome messages, sign-in alerts, password-change
                    alerts, password-reset links and form submission
                    confirmations.
                </p>
                <p>
                    Delivery depends on how the deployment is configured: the
                    server sends through an SMTP provider in development and
                    through the Resend email service in production. The message
                    content passes through that provider. Successfully sent
                    queue records are automatically purged after about 7 days.
                </p>
            </InfoSection>

            <InfoSection id="third-parties" title="Third-party services">
                <p>
                    Depending on how the instance you use is deployed, data may
                    reach the following processors. Each is configured by the
                    operator of the deployment:
                </p>
                <InfoList
                    items={[
                        <>
                            <strong>MongoDB hosting.</strong> Applications and
                            response data are stored in a MongoDB database
                            wherever the operator hosts it.
                        </>,
                        <>
                            <strong>Email provider.</strong> SMTP (in
                            development setups) or Resend (in production)
                            delivers the transactional emails listed above.
                        </>,
                        <>
                            <strong>Cloudinary.</strong> If you upload an
                            avatar, the browser uploads the image directly to
                            Cloudinary using a server-signed request. The server
                            itself never proxies image files.
                        </>,
                        <>
                            <strong>Google Fonts.</strong> The web interface
                            loads font stylesheets from fonts.googleapis.com,
                            which shares your IP address and user-agent with
                            Google as a normal web request.
                        </>,
                        <>
                            <strong>GitHub.</strong> Repository and issue links
                            and any content you post there are handled by
                            GitHub.
                        </>,
                    ]}
                />
                <p>
                    There is no analytics service, crash reporter or advertising
                    network in the application.
                </p>
            </InfoSection>

            <InfoSection id="retention" title="Retention and deletion">
                <InfoList
                    items={[
                        'Responses and form content are kept until they are removed; the current version has no automatic expiry.',
                        'Deleting a form removes the form, its sections and its questions, but responses already collected are not deleted automatically.',
                        'Requesting account deletion flags the account and blocks sign-in after 30 days; signing in before then cancels the request. The current version does not automatically erase stored data, so contact the maintainers if you need data actually removed.',
                        'Password-reset records expire after 15 minutes and are cleared when used; an unused record can remain attached to your account.',
                        'Successfully sent email queue records are deleted after about 7 days. Failed sends can remain until cleaned up manually.',
                        'Server logs live on the hosting platform and their retention depends on how the operator configures it.',
                        'Database backups are controlled by whoever operates the deployment. The repository does not implement a backup system, so backup retention is not specified here.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="your-choices" title="Your choices">
                <InfoList
                    items={[
                        'Update your profile and personal details from account settings at any time.',
                        'Use the delete-account action, then contact the maintainers if you want stored data erased.',
                        'Form owners can export the responses to their own forms as CSV. Respondents cannot export their own answers through the interface — ask the form owner or the maintainers.',
                        'Ask questions or make access and correction requests through the contact channels.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="form-creators" title="For form creators">
                <p>
                    If you collect other people&rsquo;s information with
                    Paperwork, you are responsible for how you use it. That
                    includes having a lawful reason to collect it, telling
                    respondents what you collect and why, and handling their
                    data in line with the rules that apply to you.
                </p>
                <InfoList
                    items={[
                        'Every submission stores the respondent\u2019s email address, IP address and user-agent automatically — assume those are collected even when a question does not ask for them.',
                        'Only collect what you need, and avoid using forms for illegal or unnecessarily sensitive data.',
                        'Remember that deleting a form does not delete the responses collected so far.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="security" title="Security">
                <InfoList
                    items={[
                        'Passwords are stored as Argon2 hashes with a server-side secret.',
                        'Refresh sessions use HTTP-only, SameSite cookies; access tokens are short-lived (about 15 minutes) and kept in memory.',
                        'Requests are rate limited and security-relevant failures are logged with secrets and personal fields redacted.',
                        'Deployments are expected to serve the application over HTTPS.',
                    ]}
                />
                <p>
                    No system is perfectly secure. These measures reduce risk,
                    but we cannot guarantee that data will never be accessed,
                    altered or lost. If you find a security problem, please
                    follow the reporting guidance on the{' '}
                    <a href="/contact" className={linkClass}>
                        contact page
                    </a>
                    .
                </p>
            </InfoSection>

            <InfoSection id="changes" title="Changes to this policy">
                <p>
                    This policy may be updated as the application changes. The
                    date at the top of this page shows the last revision.
                    Significant changes will be reflected in the repository so
                    they can be reviewed.
                </p>
            </InfoSection>

            <InfoSection id="contact" title="Contact">
                <p>
                    Privacy questions, access requests and deletion requests go
                    through the{' '}
                    <a href="/contact" className={linkClass}>
                        contact channels
                    </a>
                    . The same routes reach the maintainers for questions about
                    the{' '}
                    <a href="/terms" className={linkClass}>
                        Terms &amp; Conditions
                    </a>
                    .
                </p>
            </InfoSection>
        </InfoPageShell>
    );
}
