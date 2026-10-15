'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { SolarInfoCircleBroken } from '../icons';

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group *:font-sans"
            icons={{
                success: (
                    <SolarInfoCircleBroken className="size-5 text-emerald-400" />
                ),
                error: (
                    <SolarInfoCircleBroken className="size-5 text-rose-400" />
                ),
                info: <SolarInfoCircleBroken className="size-5 text-sky-400" />,
                warning: (
                    <SolarInfoCircleBroken className="size-5 text-amber-400" />
                ),
            }}
            style={
                {
                    /* --- Core Dimensions --- */
                    '--border-radius':
                        'var(--theme-toast-radius, var(--radius-md, 8px))',

                    /* --- Base Glass Surface Variables --- */
                    '--normal-bg': 'var(--theme-surface)',
                    '--normal-border': 'var(--theme-surface-hover)',
                    '--normal-text': 'var(--theme-on-surface)',

                    /* --- Success State (Dynamic Glass from Token) --- */
                    '--success-bg':
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-toast-success-surface) 20%, transparent), color-mix(in srgb, var(--theme-toast-success-surface) 5%, transparent))',
                    '--success-border':
                        'color-mix(in srgb, var(--theme-toast-success-surface) 15%, transparent)',
                    '--success-text': 'var(--theme-toast-success-on-surface)',

                    /* --- Error / Danger State (Dynamic Glass from Token) --- */
                    '--error-bg':
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-toast-danger-surface) 20%, transparent), color-mix(in srgb, var(--theme-toast-danger-surface) 5%, transparent))',
                    '--error-border':
                        'color-mix(in srgb, var(--theme-toast-danger-surface) 15%, transparent)',
                    '--error-text': 'var(--theme-toast-danger-on-surface)',

                    /* --- Info State (Dynamic Glass from Token) --- */
                    '--info-bg':
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-toast-info-surface) 20%, transparent), color-mix(in srgb, var(--theme-toast-info-surface) 5%, transparent))',
                    '--info-border':
                        'color-mix(in srgb, var(--theme-toast-info-surface) 15%, transparent)',
                    '--info-text': 'var(--theme-toast-info-on-surface)',

                    /* --- Warning State (Dynamic Glass from Token) --- */
                    '--warning-bg':
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-toast-warn-surface) 20%, transparent), color-mix(in srgb, var(--theme-toast-warn-surface) 5%, transparent))',
                    '--warning-border':
                        'color-mix(in srgb, var(--theme-toast-warn-surface) 15%, transparent)',
                    '--warning-text': 'var(--theme-toast-warn-on-surface)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/20 group-[.toaster]:border-t-white/10 group-[.toaster]:transition-all group-[.toaster]:duration-300 group-[.toaster]:ease-out hover:group-[.toaster]:-translate-y-0.5',
                    title: 'text-sm font-semibold tracking-tight',
                    description: 'text-xs text-neutral-400 font-medium',
                    actionButton:
                        'group-[.toast]:bg-brand-depth group-[.toast]:text-on-brand-depth group-[.toast]:rounded-full',
                    cancelButton:
                        'group-[.toast]:bg-white/5 group-[.toast]:text-white group-[.toast]:rounded-full',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
