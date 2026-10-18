import type { Metadata } from 'next';
import InfoPageShell, {
    type TocItem,
} from '@/features/info/components/InfoPageShell';
import { InfoList, InfoSection } from '@/features/info/components/InfoSection';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
    title: `${siteConfig.name} | Contact & Support`,
    description:
        'How to reach the Paperwork maintainers for bugs, feature requests, privacy questions and security reports.',
};

const toc: TocItem[] = [
    { id: 'channels', label: 'Where to ask' },
    { id: 'what-to-include', label: 'What to include' },
    { id: 'sensitive-data', label: 'Sensitive information' },
    { id: 'expectations', label: 'What to expect' },
];

const cardClass =
    'flex flex-col gap-2 rounded-2xl border border-theme-on-surface/15 bg-theme-surface p-5 transition-colors hover:bg-theme-surface-hover';
const cardLinkClass =
    'mt-auto inline-flex items-center gap-1 rounded-md text-sm font-medium text-brand-depth underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-depth focus-visible:ring-offset-2 focus-visible:ring-offset-theme-surface';

export default function ContactPage() {
    return (
        <InfoPageShell
            title="Contact & Support"
            intro="Paperwork is a small open-source project. There is no support desk, chat or email address — everything goes through the public repository, where problems and requests can be tracked and answered in the open."
            toc={toc}
        >
            <InfoSection id="channels" title="Where to ask">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className={cardClass}>
                        <span
                            aria-hidden
                            className="material-symbols-outlined text-brand-depth text-2xl"
                        >
                            bug_report
                        </span>
                        <h3 className="font-semibold">
                            Bugs &amp; feature requests
                        </h3>
                        <p className="text-theme-on-surface/70 text-sm">
                            Open an issue on GitHub. Search existing issues
                            first — the answer may already be there. GitHub
                            Discussions is not enabled on this repository, so
                            Issues is the public channel for everything.
                        </p>
                        <a
                            href={siteConfig.issuesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cardLinkClass}
                        >
                            Open an issue
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    </div>

                    <div className={cardClass}>
                        <span
                            aria-hidden
                            className="material-symbols-outlined text-brand-depth text-2xl"
                        >
                            shield
                        </span>
                        <h3 className="font-semibold">Security reports</h3>
                        <p className="text-theme-on-surface/70 text-sm">
                            Do not post exploit details, tokens, passwords or
                            private data in public issues. Ask the maintainer
                            for a private channel first, then share details
                            there. Private vulnerability reporting is not yet
                            enabled on the repository.
                        </p>
                        <div className="mt-auto flex flex-wrap gap-x-5">
                            <a
                                href={siteConfig.maintainerProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cardLinkClass}
                            >
                                Contact the maintainer
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <span
                            aria-hidden
                            className="material-symbols-outlined text-brand-depth text-2xl"
                        >
                            policy
                        </span>
                        <h3 className="font-semibold">Privacy &amp; legal</h3>
                        <p className="text-theme-on-surface/70 text-sm">
                            Data access, correction and deletion requests, or
                            questions about the Privacy Policy or Terms. The
                            current version of account deletion flags the
                            account only, so real erasure has to be handled by
                            the maintainers through a request.
                        </p>
                        <div className="mt-auto flex flex-wrap gap-x-5">
                            <a
                                href={siteConfig.issuesUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cardLinkClass}
                            >
                                Open an issue
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                            <a
                                href={siteConfig.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cardLinkClass}
                            >
                                Repository
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <span
                            aria-hidden
                            className="material-symbols-outlined text-brand-depth text-2xl"
                        >
                            build
                        </span>
                        <h3 className="font-semibold">Self-hosting</h3>
                        <p className="text-theme-on-surface/70 text-sm">
                            Questions about running your own instance belong on
                            GitHub too. Describe your environment: versions,
                            deployment method and the exact error output.
                        </p>
                        <a
                            href={siteConfig.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cardLinkClass}
                        >
                            View the source
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    </div>
                </div>
            </InfoSection>

            <InfoSection id="what-to-include" title="What to include">
                <p>
                    A report that can be acted on usually answers these
                    questions:
                </p>
                <InfoList
                    items={[
                        'What were you trying to do, and what happened instead?',
                        'The exact error message shown, copied as text if possible.',
                        'Steps that reproduce the problem, including the form id (from /forms/c/<form-id>) when a specific form is involved.',
                        'Your browser and operating system, and whether you were signed in.',
                        'Screenshots, if they help — but hide any personal data first.',
                    ]}
                />
            </InfoSection>

            <InfoSection id="sensitive-data" title="Sensitive information">
                <p>
                    GitHub issues are public forever. Never paste passwords,
                    access or refresh tokens, verification codes, API keys or
                    other people&rsquo;s responses into an issue. If a problem
                    can only be reproduced with private data, ask for a private
                    channel first and share the minimum needed.
                </p>
            </InfoSection>

            <InfoSection id="expectations" title="What to expect">
                <InfoList
                    items={[
                        'Paperwork is maintained on a volunteer basis. There is no guaranteed response time and no service-level agreement.',
                        'Issues are public: they may be commented on, labeled or closed with a workaround, and security-sensitive reports may be handled quietly until a fix is available.',
                        'This site links only to the public repository and maintainer profile. If you received a support email claiming to be from Paperwork, treat it with suspicion.',
                    ]}
                />
                <p>
                    For everything the application stores and where it goes, see
                    the{' '}
                    <a
                        href="/privacy"
                        className="text-brand-depth focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </InfoSection>
        </InfoPageShell>
    );
}
