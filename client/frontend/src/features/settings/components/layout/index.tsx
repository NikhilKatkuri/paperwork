'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../client/Sidebar';
import { cn } from '@/utils/cn';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const lastSegment = pathname.split('/').filter(Boolean).at(-1);
    const isMainSettingsPage = lastSegment === 'settings';

    return (
        <div className="flex w-full overflow-hidden p-3 md:items-center md:justify-center md:p-4">
            <div className="border-theme-skeletion-surface grid w-full max-w-4xl grid-cols-[18rem_1fr] gap-4 rounded-2xl border max-md:mb-32 max-md:grid-cols-1 md:h-full md:max-h-180 md:p-2">
                <Sidebar currentRoute={pathname} />

                <div
                    className={cn(
                        'overflow-y-scroll p-4 px-6 md:overflow-hidden md:p-2',
                        isMainSettingsPage && 'max-md:hidden'
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
