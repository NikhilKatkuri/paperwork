'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isInfoPath, isProtectedPath, isPublicPath } from '@/_paths';
import { useAuth } from './AuthProviders';

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
    const { initializing } = useAuth();
    const pathname = usePathname();

    // The landing page and information pages (privacy, terms, help, contact)
    // are public, and proxy-protected pages render their IndexedDB snapshot
    // immediately: the server proxy already validated the session, and their
    // API calls wait behind the session gate. Everything else still waits out
    // the bootstrap.
    if (
        initializing &&
        !isInfoPath(pathname) &&
        !isPublicPath(pathname) &&
        !isProtectedPath(pathname)
    ) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
