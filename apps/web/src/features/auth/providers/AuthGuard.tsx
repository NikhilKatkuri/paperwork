'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isInfoPath } from '@/_paths';
import { useAuth } from './AuthProviders';

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
    const { initializing } = useAuth();
    const pathname = usePathname();

    // Information pages (privacy, terms, help, contact) are static and do
    // not depend on auth state, so render them immediately instead of
    // gating them behind the session loading screen.
    if (initializing && !isInfoPath(pathname)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
