'use client';

import { useState } from 'react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function PasswordModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    error,
}: PasswordModalProps) {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        await onConfirm(password);
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Confirm Security Changes
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Please enter your account password to confirm these changes.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-4 flex flex-col gap-4"
                >
                    <div>
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                            required
                            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {error && (
                            <p className="mt-2 text-xs font-medium text-red-500">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setPassword('');
                                onClose();
                            }}
                            disabled={isLoading}
                            className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
