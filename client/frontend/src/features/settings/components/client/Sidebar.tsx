'use client';

import { cn } from '@/utils/cn';
import { SidebarIntent } from '../../constants/config';
import { useRouter } from 'next/navigation';

function shouldShowSidebar(pathname: string) {
    const segments = ['edit-profile', 'account', 'password', 'security'];
    return !segments.some((segment) =>
        pathname.includes(`/settings/${segment}`)
    );
}

export default function Sidebar({ currentRoute }: { currentRoute: string }) {
    const router = useRouter();
    const showSidebar = shouldShowSidebar(currentRoute);

    return (
        <div
            className={cn(
                '*:text-theme-on-surface/80 flex h-full w-full flex-col gap-4 rounded-2xl p-4 shadow-[12px_12px_53px_0px_rgba(71,85,105,0.08)] max-md:min-h-full md:w-72 md:max-w-72 md:gap-2',
                !showSidebar && 'max-md:hidden'
            )}
        >
            <h1 className="w-full p-2 font-medium">Settings</h1>
            <div className="grid grid-cols-1 gap-3 *:text-sm md:gap-2">
                {SidebarIntent.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => {
                            router.push(item.route);
                        }}
                        className="w-full"
                    >
                        <div
                            className={cn(
                                'grid w-full cursor-pointer grid-cols-[24px_1fr] items-center gap-4 rounded-lg bg-transparent p-2 transition-colors duration-200 ease-in-out',
                                currentRoute.startsWith(item.route)
                                    ? 'bg-brand-light/50 text-brand-depth'
                                    : 'hover:bg-brand-light/50 hover:text-brand-depth'
                            )}
                        >
                            <span className="material-symbols-outlined">
                                {item.icon}
                            </span>
                            <p className="text-left">{item.name}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
