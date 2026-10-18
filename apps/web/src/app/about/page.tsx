import type { Metadata } from 'next';
import InfoPageShell, {
    type TocItem,
} from '@/features/info/components/InfoPageShell';
import { InfoList, InfoSection } from '@/features/info/components/InfoSection';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
    title: `${siteConfig.name} | About the Project`,
    description:
        'What Paperwork does, why it exists, its project disclaimer, and the limitations to review before relying on it.',
};

const toc: TocItem[] = [
    { id: 'what-it-does', label: 'What Paperwork does' },
    { id: 'why', label: 'Why it exists' },
    { id: 'disclaimer', label: 'Project disclaimer' },
    { id: 'limitations', label: 'Limitations' },
    { id: 'source', label: 'Source code' },
    { id: 'contact', label: 'Contact' },
];

const linkClass =
    'rounded-md text-brand-depth font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function AboutPage() {
    return (
        <InfoPageShell
            title="About the Project"
            intro="Paperwork is an independently developed, open-source form builder and response collection application. This page explains what the current implementation does, why it exists, and what to keep in mind before relying on it."
            toc={toc}
        >
            <InfoSection id="what-it-does" title="What Paperwork does">
                <p>
                    Paperwork is a form builder and response collection
                    application. The current implementation covers the path from
                    creating a form to reviewing the responses it collects:
                </p>
                <InfoList
                    items={[
                        'Create and edit forms with sections and several question types, with drafts kept in your browser while you edit.',
                        'Configure form settings, including the appearance and the publishing state that controls whether a form accepts responses.',
                        'Publish a form and share its link; signed-in users can open and submit it — respondents need an account, and submissions are recorded with the submitting account.',
                        'Collect and manage responses: view, search and filter them, and export a form\u2019s responses as CSV.',
                        'Start from ready-made templates instead of an empty form.',
                        'Manage your account: email verification, optional two-factor authentication, password reset, profile and account settings, and a 30-day account-deletion grace period.',
                        'Receive transactional email: verification codes, sign-in alerts, password-change alerts, password-reset links and submission confirmations.',
                    ]}
                />
                <p>
                    The software is a Next.js web client talking to an Express
                    API backed by MongoDB. Email is queued in the database and
                    delivered through SMTP or Resend depending on how the
                    deployment is configured. The source code is public — see{' '}
                    <a href="#source" className={linkClass}>
                        source code
                    </a>{' '}
                    below.
                </p>
            </InfoSection>

            <InfoSection id="why" title="Why it exists">
                <p>
                    Paperwork is a practical learning and experimentation
                    project. It exists to explore ideas and understand software
                    engineering technologies by building and running a complete
                    application, rather than by reading about them.
                </p>
                <p>
                    The features and design decisions in the project reflect the
                    maintainer&rsquo;s own ideas, experiments and learning
                    goals. Architecture choices — a schema-driven form model, a
                    MongoDB document store, separate web and API applications in
                    one repository — were made to practice full-stack
                    engineering with real constraints, and they are documented
                    and open to discussion in the repository.
                </p>
            </InfoSection>

            <InfoSection id="disclaimer" title="Project disclaimer">
                <p>
                    Paperwork is an independently developed, open-source
                    project. It is not affiliated with, endorsed by, sponsored
                    by, or intended to impersonate any company or existing
                    product, unless an actual affiliation is stated explicitly.
                </p>
                <p>
                    Similarities to existing products or workflows may arise
                    because form creation and response collection are common
                    software concepts implemented in many tools. Those
                    similarities are incidental. The project does not claim
                    ownership of any third party&rsquo;s trademarks, branding or
                    intellectual property, and names of other products are
                    referenced, if at all, only to describe facts.
                </p>
                <p>
                    Before relying on Paperwork for important information or
                    workflows, evaluate what it currently does and the
                    limitations described below. The project is honest about
                    both: functionality that is implemented and tested is listed
                    as such, and everything else should be treated as
                    unfinished.
                </p>
            </InfoSection>

            <InfoSection id="limitations" title="Limitations">
                <InfoList
                    items={[
                        'The project is actively developed. Features, interfaces and data handling may change between versions, and some parts are incomplete or experimental.',
                        'Availability, performance, data retention and backups depend on the deployment you use. There is no service-level guarantee — the hosted instance is best-effort, and self-hosted instances are run by whoever operates them.',
                        'Do not rely on the service as the only copy of important information. Form owners can export responses as CSV, and copies of anything important should be kept elsewhere.',
                        'If you collect other people\u2019s data, you are responsible for having a lawful basis and for handling that data appropriately; Paperwork does not provide compliance guarantees.',
                        'Security features are implemented and documented — hashed passwords, short-lived tokens, rate limiting and security logging — but no system is perfectly secure. Review the Security section of the Privacy Policy before sharing sensitive information.',
                    ]}
                />
                <p>
                    These limitations are stated so you can judge the project
                    accurately, not to diminish it: the implemented features are
                    usable today, and their behavior is described in detail in
                    the{' '}
                    <a href="/privacy" className={linkClass}>
                        Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="/terms" className={linkClass}>
                        Terms &amp; Conditions
                    </a>
                    .
                </p>
            </InfoSection>

            <InfoSection id="source" title="Source code">
                <p>
                    The source code is public at{' '}
                    <a
                        href={siteConfig.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                    >
                        github.com/NikhilKatkuri/paperwork
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    , and issues can be reported in the repository&rsquo;s{' '}
                    <a
                        href={siteConfig.issuesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                    >
                        issue tracker
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    . The source is distributed under the{' '}
                    {siteConfig.declaredLicense} license declared in the
                    repository&rsquo;s package metadata; the{' '}
                    <a href="/terms" className={linkClass}>
                        Terms &amp; Conditions
                    </a>{' '}
                    describe the current licensing state, including the missing
                    standalone LICENSE file.
                </p>
            </InfoSection>

            <InfoSection id="contact" title="Contact">
                <p>
                    Questions, feedback and corrections are welcome through the{' '}
                    <a href="/contact" className={linkClass}>
                        contact channels
                    </a>
                    . See also the{' '}
                    <a href="/help" className={linkClass}>
                        Help Center
                    </a>{' '}
                    for how-to guides and the{' '}
                    <a href="/privacy" className={linkClass}>
                        Privacy Policy
                    </a>{' '}
                    for how data is handled.
                </p>
            </InfoSection>
        </InfoPageShell>
    );
}
