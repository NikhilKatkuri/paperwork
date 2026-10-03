'use client';

import { useAuth } from '@/providers';
import { cn } from '@/utils/cn';
import normalizeUrl, { NormalizedUrl } from '@/utils/profile';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import ThemePicker from './ui/ThemePicker';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    name: string;
    isHovered?: () => boolean;
}

function IconButton({ name, isHovered, ...props }: IconButtonProps) {
    const _isHovered = isHovered?.() ?? false;
    return (
        <div className="group flex cursor-pointer flex-col items-center justify-center">
            <button
                {...props}
                className={cn(
                    'flex h-10 w-16 items-center justify-center rounded-full transition-colors duration-300 ease-out',
                    _isHovered
                        ? 'bg-brand-light'
                        : 'group-hover:bg-theme-form-surface-hover',
                    props?.className
                )}
            >
                <span
                    className={cn(
                        'material-symbols-outlined text-theme-on-surface text-center transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                        _isHovered
                            ? 'text-on-brand-light material-filled scale-110'
                            : 'group-hover:text-theme-form-on-surface-hover group-hover:scale-110'
                    )}
                >
                    {name}
                </span>
            </button>

            <p className="text-theme-on-surface mt-0.5 text-center text-[12px] font-normal transition-all duration-200 ease-out group-hover:scale-[1.02] group-hover:font-medium">
                {name.charAt(0).toUpperCase() + name.slice(1)}
            </p>
        </div>
    );
}

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="z-50 h-full w-24 bg-slate-100 max-[44rem]:fixed max-[44rem]:bottom-0 max-[44rem]:left-0 max-[44rem]:h-20 max-[44rem]:w-full">
            <div className="bg-brand-light/30 grid h-full w-full grid-cols-3 items-center py-6 max-[44rem]:py-0 min-[44rem]:grid-cols-1 min-[44rem]:grid-rows-[66px_66px_1fr] min-[44rem]:gap-4">
                {children}
            </div>
        </div>
    );
}

function getHover(pathname: string) {
    if (pathname.startsWith('/user/settings')) {
        return 'settings';
    }
    if (pathname === '/user') {
        return 'home';
    }
    return undefined;
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { publicProfile } = useAuth();
    const profile: NormalizedUrl = normalizeUrl(publicProfile?.avatarUrl || '');

    return (
        <Wrapper>
            <IconButton
                onClick={() => router.push('/user')}
                name="home"
                isHovered={() => getHover(pathname) === 'home'}
            />
            <IconButton
                onClick={() => router.push('/user/settings')}
                name="settings"
                isHovered={() => getHover(pathname) === 'settings'}
            />

            {/* Positioned by the picker itself: anchored left of the rail on
                wide screens, a bottom sheet under 44rem where the rail becomes
                a fixed bar. */}
            <div className="flex flex-col items-center justify-center min-[44rem]:self-start">
                <ThemePicker
                    label="Theme"
                    className="hover:bg-brand-light h-10 w-16"
                />
            </div>

            <div className="group flex flex-col items-center justify-center *:cursor-pointer *:**:transition-all *:**:duration-150 *:**:ease-in-out min-[44rem]:self-end">
                <button className="max-[44rem]:group-hover:bg-brand-light flex h-10 w-16 items-center justify-center rounded-full">
                    <div className="bg-brand aspect-square h-8 overflow-hidden rounded-full min-[44rem]:h-10">
                        {profile.type === 'random' ? (
                            <div
                                className={cn(
                                    'flex h-full w-full items-center justify-center'
                                )}
                                style={{ backgroundColor: profile.color }}
                            >
                                <span className="text-center text-xs font-medium text-white">
                                    {profile.name
                                        .split(' ')
                                        .slice(0, 2)
                                        .map((n) => n.charAt(0).toUpperCase())
                                        .join('')}
                                </span>
                            </div>
                        ) : profile.url ? (
                            <Image
                                src={profile.url}
                                alt="Profile"
                                width={96}
                                height={96}
                                className="h-full w-full object-cover"
                                unoptimized={profile.url.startsWith('data:')}
                            />
                        ) : (
                            <div className="bg-brand-light aspect-square h-full animate-pulse"></div>
                        )}
                    </div>
                </button>
                <p className="mt-1/2 text-center text-[12px] font-normal group-hover:font-medium min-[44rem]:hidden">
                    Profile
                </p>
            </div>
        </Wrapper>
    );
}
