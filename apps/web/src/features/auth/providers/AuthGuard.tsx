'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isInfoPath, isProtectedPath } from '@/_paths';
import { useAuth } from './AuthProviders';

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
    const { initializing } = useAuth();
    const pathname = usePathname();

    // Information pages (privacy, terms, help, contact) are static, and
    // proxy-protected pages render their IndexedDB snapshot immediately: the
    // server proxy already validated the session, and their API calls wait
    // behind the session gate. Everything else still waits out the
    // bootstrap.
    if (initializing && !isInfoPath(pathname) && !isProtectedPath(pathname)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
