'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * localStorage key remembering that the visitor acknowledged the intro. The
 * dialog is informational, not consent: acknowledgement is only stored to
 * stop the dialog from reappearing on every visit.
 */
export const WELCOME_ACKNOWLEDGED_KEY = 'paperwork:welcome-acknowledged';

/**
 * Module-level flag so a dismissal also holds for the rest of the session
 * when browser storage is unavailable (private mode, blocked storage) and the
 * component is ever remounted by a client-side navigation or fast refresh.
 */
let acknowledgedThisSession = false;

const listeners = new Set<() => void>();

const readAcknowledged = (): boolean => {
    if (acknowledgedThisSession) return true;
    try {
        return window.localStorage.getItem(WELCOME_ACKNOWLEDGED_KEY) === 'true';
    } catch {
        return false;
    }
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getServerSnapshot = (): boolean => true;

const persistAcknowledged = (): void => {
    acknowledgedThisSession = true;
    try {
        window.localStorage.setItem(WELCOME_ACKNOWLEDGED_KEY, 'true');
    } catch {
        // Storage unavailable: the dialog still closes and stays closed for
        // this session; it may reappear on a future visit.
    }
    listeners.forEach((listener) => listener());
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * First-visit welcome dialog introducing the project.
 *
 * - Keeps the SSR snapshot "acknowledged" so nothing renders on the server or
 *   during hydration; the client snapshot then decides whether to show it,
 *   which keeps hydration stable without calling setState in an effect.
 * - Escape and the close button dismiss it; both actions persist the
 *   acknowledgement. "Read project details" additionally navigates to the
 *   About page, which also carries the full disclaimer.
 * - Focus moves into the dialog on open, cycles inside it while open, and
 *   returns to the previously focused element on dismissal.
 */
export default function WelcomeDialog() {
    const router = useRouter();
    const acknowledged = useSyncExternalStore(
        subscribe,
        readAcknowledged,
        getServerSnapshot
    );
    const open = !acknowledged;
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    const dismiss = useCallback(() => {
        persistAcknowledged();
    }, []);

    useEffect(() => {
        if (!open) return;

        previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        dialogRef.current?.focus();

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                dismiss();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocusedRef.current?.focus();
            previouslyFocusedRef.current = null;
        };
    }, [open, dismiss]);

    const handleTabTrap = (event: React.KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        const focusables =
            dialogRef.current?.querySelectorAll<HTMLElement>(
                FOCUSABLE_SELECTOR
            );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const handleReadDetails = () => {
        persistAcknowledged();
        router.push('/about');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="welcome-dialog-title"
                aria-describedby="welcome-dialog-intro"
                tabIndex={-1}
                onKeyDown={handleTabTrap}
                className="bg-theme-surface text-theme-on-surface border-theme-on-surface/10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl focus:outline-none sm:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/paperwork_icon-vector-master.svg"
                            alt=""
                            width={28}
                            height={28}
                        />
                        <span className="text-sm font-semibold">Paperwork</span>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Close welcome dialog"
                        className="text-theme-on-surface/60 hover:text-theme-on-surface focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface -m-2 rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                <h2
                    id="welcome-dialog-title"
                    className="mt-4 text-xl font-semibold sm:text-2xl"
                >
                    Welcome to Paperwork 👋
                </h2>

                <p
                    id="welcome-dialog-intro"
                    className="text-theme-on-surface/80 mt-3 text-sm leading-relaxed sm:text-base"
                >
                    Paperwork is an independent, open-source project built to
                    explore ideas, experiment with technologies, and learn by
                    building a real application.
                </p>

                <div className="mt-5 space-y-4 text-sm leading-relaxed sm:text-base">
                    <div>
                        <h3 className="text-sm font-semibold">
                            What you can do
                        </h3>
                        <p className="text-theme-on-surface/80 mt-1">
                            Create forms, share them, and collect responses
                            using the features currently available in the
                            project.
                        </p>
                    </div>

                    <div className="border-theme-on-surface/10 bg-theme-surface-hover/40 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">
                            Project disclaimer
                        </h3>
                        <p className="text-theme-on-surface/80 mt-1">
                            This project is independently developed for learning
                            and experimentation. It is not affiliated with or
                            endorsed by any company or existing product.
                            Features may evolve, and availability and data
                            handling depend on the deployment. Please review the
                            project details and privacy policy before sharing
                            sensitive information.
                        </p>
                    </div>
                </div>

                <nav
                    aria-label="Project information"
                    className="border-theme-on-surface/10 mt-5 border-t pt-4"
                >
                    <ul className="text-theme-on-surface/70 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <li>
                            <Link
                                href="/about"
                                className="focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                About the Project
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/privacy"
                                className="focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/terms"
                                className="focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-md transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                Terms &amp; Conditions
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={handleReadDetails}
                        className="border-theme-on-surface/15 hover:bg-theme-surface-hover focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        Read project details
                    </button>
                    <button
                        type="button"
                        onClick={dismiss}
                        className="bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 focus-visible:ring-brand-depth focus-visible:ring-offset-theme-surface rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        Got it, let&rsquo;s explore
                    </button>
                </div>
            </div>
        </div>
    );
}
