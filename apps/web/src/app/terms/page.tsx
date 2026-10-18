import type { Metadata } from 'next';
import InfoPageShell, {
    type TocItem,
} from '@/features/info/components/InfoPageShell';
import { InfoList, InfoSection } from '@/features/info/components/InfoSection';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
    title: `${siteConfig.name} | Terms & Conditions`,
    description:
        'The terms that govern using the Paperwork application and any hosted deployment of it, including accounts, content, licensing and disclaimers.',
};

const toc: TocItem[] = [
    { id: 'about', label: 'About these terms' },
    { id: 'software-and-service', label: 'Software and service' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'your-content', label: 'Your content' },
    { id: 'acceptable-use', label: 'Acceptable use' },
    { id: 'form-creators', label: 'If you collect responses' },
    { id: 'availability', label: 'Availability and changes' },
    { id: 'suspension', label: 'Suspension and termination' },
    { id: 'license', label: 'License' },
    { id: 'disclaimer', label: 'Disclaimer' },
    { id: 'liability', label: 'Limitation of liability' },
    { id: 'changes', label: 'Changes to these terms' },
    { id: 'contact', label: 'Contact' },
];

const linkClass =
    'rounded-md text-brand-depth font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function TermsPage() {
    return (
        <InfoPageShell
            title="Terms & Conditions"
            intro="These terms describe how you may use the Paperwork application and any hosted deployment of it. They are written to match what the software actually does today, and they are not legal advice."
            toc={toc}
        >
            <InfoSection id="about" title="About these terms">
                <p>
                    By creating an account, opening a form or otherwise using a
                    Paperwork deployment, you agree to these terms. If you do
                    not agree, please do not use the service.
                </p>
                <p>
                    Paperwork is an open-source project maintained by its
                    contributors. There is no separate company or legal entity
                    behind it, and these terms are not governed by a
                    jurisdiction clause. Where a deployment is operated by an
                    organization, that operator is responsible for the service
                    it provides. What the software does, and the project&rsquo;s
                    own disclaimer, are described on the{' '}
                    <a href="/about" className={linkClass}>
                        About the Project
                    </a>{' '}
                    page.
                </p>
            </InfoSection>

            <InfoSection id="software-and-service" title="Software and service">
                <InfoList
                    items={[
                        'The software is the Paperwork source code in the public repository.',
                        'The service is any running deployment of that software — whether ours, another organization\u2019s or your own self-hosted instance.',
                        'Self-hosted deployments are controlled entirely by whoever operates them. The project maintainers cannot access, recover, modify or delete data in a self-hosted instance and take no responsibility for how it is run.',
                        'The hosted instance you are using is not covered by a service-level agreement. It is provided on a best-effort basis.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="accounts" title="Accounts">
                <InfoList
                    items={[
                        'You need an account to create forms and to open and submit forms. Provide accurate details and keep your password and two-factor settings secure.',
                        'You are responsible for activity under your account. Sign-in alerts and password-change notifications are sent to your email address.',
                        'Do not share your account or impersonate someone else.',
                        'You can request deletion from account settings. Deletion takes effect after a 30-day grace period, and signing in during that period cancels the request. The current version does not automatically erase stored data — see the Privacy Policy for what that means.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="your-content" title="Your content">
                <p>
                    You keep ownership of the forms, responses and other content
                    you create. You grant the deployment operator the
                    permissions needed to store, process and display that
                    content in order to run the service — for example, showing
                    responses to a form&rsquo;s owner or sending a submission
                    confirmation email.
                </p>
                <InfoList
                    items={[
                        'Responses are visible to the owner of the form they were submitted to, and submission confirmations are emailed when an address is available.',
                        'You are responsible for your content and for having the right to collect the information you ask for.',
                        'Do not upload content that is illegal, infringing or harmful.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="acceptable-use" title="Acceptable use">
                <p>You agree not to:</p>
                <InfoList
                    items={[
                        'Break the law or help others do so, including through the data you collect with forms.',
                        'Collect or share other people\u2019s personal or sensitive information without the authorization and legal basis the rules that apply to you require.',
                        'Attempt to access accounts, data or systems you are not authorized to access, or bypass access controls.',
                        'Interfere with the service: overwhelming it, scraping it abusively, probing it for vulnerabilities outside a responsible-reporting process, abusing public endpoints, or intentionally exhausting shared resources such as rate limits, storage or email sending.',
                        'Send spam or use forms to harass, deceive or phish people.',
                        'Upload malicious code or content that would damage the service or other users.',
                        'Upload content that infringes someone else\u2019s intellectual property, privacy or other rights.',
                    ]}
                />
                <p>
                    If you are submitting a form, review it before sharing
                    personal information: check who is asking, why, and whether
                    the request makes sense, and only provide what the form
                    actually needs.
                </p>
                <p>
                    We may remove content or restrict accounts that violate
                    these rules, and may report unlawful activity where
                    required.
                </p>
            </InfoSection>

            <InfoSection id="form-creators" title="If you collect responses">
                <p>
                    If you publish a form, you are the controller of the data it
                    collects. That means you are responsible for:
                </p>
                <InfoList
                    items={[
                        'Having a lawful basis to collect the information and telling respondents what you do with it.',
                        'Only asking for what you need, and handling sensitive topics appropriately.',
                        'Every submission automatically records the respondent\u2019s email, IP address and browser user-agent.',
                        'Deleting a form does not delete responses collected so far — you must handle retention yourself.',
                    ]}
                />
                <p>
                    The{' '}
                    <a href="/privacy" className={linkClass}>
                        Privacy Policy
                    </a>{' '}
                    explains in detail what the software stores.
                </p>
            </InfoSection>

            <InfoSection id="availability" title="Availability and changes">
                <InfoList
                    items={[
                        'The service may be unavailable during maintenance, incidents, provider outages or because of changes to the software.',
                        'Features may be added, changed or removed at any time as the project evolves.',
                        'We do not guarantee that data will be preserved indefinitely. Keep your own copies of anything important; form owners can export responses as CSV.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="suspension" title="Suspension and termination">
                <InfoList
                    items={[
                        'You may stop using the service and request account deletion at any time.',
                        'We may suspend or terminate access if these terms are violated, if required by law, or to protect the service and its users.',
                        'Where a deployment is operated by another organization, that operator makes these decisions for its instance.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="license" title="License">
                <p>
                    The Paperwork source code is distributed under the ISC
                    license declared in the repository&rsquo;s package metadata.
                    Note that the repository does not yet contain a standalone
                    LICENSE file; until it does, the package metadata is the
                    only statement of licensing.
                </p>
                <p>
                    These terms govern your use of the service and account. The
                    license governs what you may do with the source code —
                    including running, copying and modifying it, subject to the
                    license text.
                </p>
            </InfoSection>

            <InfoSection id="disclaimer" title="Disclaimer">
                <p>
                    The service and software are provided &ldquo;as is&rdquo;
                    and &ldquo;as available&rdquo;, without warranties of any
                    kind, whether express or implied. The maintainers do not
                    warrant that the service will be uninterrupted, timely,
                    secure or error-free, or that stored data will never be lost
                    or corrupted. You use Paperwork at your own risk.
                </p>
            </InfoSection>

            <InfoSection id="liability" title="Limitation of liability">
                <p>
                    To the maximum extent permitted by law, the maintainers and
                    contributors are not liable for indirect, incidental,
                    special or consequential damages, or for lost data, lost
                    profits or business interruption, arising from your use of
                    the service or software.
                </p>
                <p>
                    Where a deployment is operated by an organization, that
                    operator — not the Paperwork project — is responsible for
                    the service it provides, including any liability arising
                    from it.
                </p>
            </InfoSection>

            <InfoSection id="changes" title="Changes to these terms">
                <p>
                    These terms may be updated as the application changes. The
                    date at the top of this page shows the last revision.
                    Continued use of the service after a change means you accept
                    the updated terms; if you do not accept them, stop using the
                    service.
                </p>
            </InfoSection>

            <InfoSection id="contact" title="Contact">
                <p>
                    Questions about these terms go through the{' '}
                    <a href="/contact" className={linkClass}>
                        contact channels
                    </a>
                    . See also the{' '}
                    <a href="/privacy" className={linkClass}>
                        Privacy Policy
                    </a>{' '}
                    and the{' '}
                    <a href="/help" className={linkClass}>
                        Help Center
                    </a>
                    .
                </p>
            </InfoSection>
        </InfoPageShell>
    );
}
