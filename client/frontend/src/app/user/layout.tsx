'use client';

import { useEffect } from 'react';
import Dashboard from '@/features/user/components/layouts/Dashboard';
import {
    applyFormTheme,
    DEFAULT_FORM_THEME,
    readFormThemeFromDb,
} from '@/lib/formTheme';

export default function UserLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useEffect(() => {
        let alive = true;

        void readFormThemeFromDb().then((theme) => {
            if (alive) applyFormTheme(theme ?? DEFAULT_FORM_THEME);
        });

        return () => {
            alive = false;
            applyFormTheme(DEFAULT_FORM_THEME);
        };
    }, []);

    return <Dashboard>{children}</Dashboard>;
}
