/**
 * Public project facts rendered on the /privacy, /terms, /help and /contact
 * pages. Keep every value here verifiable — the info pages must not invent
 * links, contacts, dates or license claims.
 *
 * Verified on October 18, 2026:
 * - Repository is public: https://github.com/NikhilKatkuri/paperwork
 * - Issues are enabled (repository metadata).
 * - GitHub Discussions are NOT enabled (GitHub API `has_discussions: false`).
 * - GitHub private vulnerability reporting is NOT enabled
 *   (GitHub API `private-vulnerability-reporting: { enabled: false }`).
 * - There is NO standalone LICENSE file in the repository; the root
 *   `package.json` declares the ISC license. Until a LICENSE file is added,
 *   the license of the source code is only as explicit as that declaration.
 *
 * Maintainer follow-ups before deploying the hosted instance:
 * - Add a LICENSE file so the source license is unambiguous.
 * - Enable private vulnerability reporting (Settings → Code security) or add
 *   a dedicated security contact, then update `securityReporting` below.
 * - Confirm hosting facts the policy cannot state today: operator name,
 *   hosting region/provider, backup retention and log retention.
 * - Decide whether account deletion should actually erase data (today it only
 *   flags the account); see the privacy policy wording.
 */
export const siteConfig = {
    name: 'Paperwork',
    repositoryUrl: 'https://github.com/NikhilKatkuri/paperwork',
    issuesUrl: 'https://github.com/NikhilKatkuri/paperwork/issues',
    maintainerProfileUrl: 'https://github.com/NikhilKatkuri',
    discussionsEnabled: false,
    securityReporting: {
        privateVulnerabilityReporting: false,
    },
    /**
     * Declared in the root `package.json`; the repository does not contain a
     * standalone LICENSE file yet.
     */
    declaredLicense: 'ISC',
    /** Fixed effective/last-reviewed date for the legal pages. */
    lastUpdated: 'October 18, 2026',
} as const;
