'use client';

import { ReactNode } from 'react';
import { useAuth } from './AuthProviders';

export const AuthGuardProvider = ({ children }: { children: ReactNode }) => {
    const { initializing } = useAuth();

    if (initializing) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading session...</p>
            </div>
        );
    }

    return <>{children}</>;
};
