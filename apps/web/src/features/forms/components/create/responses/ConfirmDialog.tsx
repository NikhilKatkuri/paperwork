'use client';

import { useCallback } from 'react';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    isLoading: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    title = 'Confirm action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
}: ConfirmDialogProps) {
    const handleConfirm = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            void onConfirm();
        },
        [onConfirm]
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div
                className={cn(
                    'w-full max-w-md rounded-2xl bg-theme-surface p-6 shadow-xl border border-theme-on-surface/10',
                    danger ? 'border-theme-on-surface/20' : ''
                )}
            >
                <h3
                    id="confirm-dialog-title"
                    className="text-theme-on-surface text-lg font-semibold"
                >
                    {title}
                </h3>
                {message && (
                    <p
                        className="mt-2 text-theme-on-surface/65 text-sm leading-relaxed"
                    >
                        {message}
                    </p>
                )}
                <form onSubmit={handleConfirm} className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md border border-theme-on-surface/15 px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                danger
                                    ? 'text-theme-on-surface hover:bg-theme-surface-hover'
                                    : 'text-theme-on-surface/70 hover:bg-theme-surface-hover'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                close
                            </span>
                            <span className="hidden sm:inline">{cancelLabel}</span>
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                danger
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-brand text-on-brand hover:opacity-90'
                            )}
                        >
                            {isLoading ? 'Deleting…' : confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
