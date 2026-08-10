'use client';
import { useEffect, useRef } from 'react';
import FormController from '../components/client/FormController';
import PasswordInput from '../components/client/PasswordInput';
import usePasswordChange from '../functions/passwordChange';
import { toast } from 'sonner';

export default function PasswordPage() {
    const { saving, changePassword } = usePasswordChange();
    const abortRef = useRef<AbortController | null>(null);
    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        if (e) e.preventDefault();

        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        try {
            const formData = new FormData(e.currentTarget);
            const currentPassword = formData.get('currentPassword') as string;
            const newPassword = formData.get('newPassword') as string;
            const confirmNewPassword = formData.get(
                'confirmNewPassword'
            ) as string;

            await changePassword({
                currentPassword,
                newPassword,
                confirmNewPassword,
                abortSignal: abortRef.current.signal,
            });
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message, error.cause);
                toast.error(error.message, {
                    position: 'top-center',
                });
            }
        }
    }

    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, []);

    const handleCancel = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
    };

    return (
        <div className="h-full w-full scrollbar-none overflow-y-auto rounded-xl px-2">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col justify-between gap-6"
            >
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-theme-on-surface text-lg font-bold md:text-xl">
                            Password Settings
                        </h1>
                        <p className="text-theme-on-surface/80 md:text-md text-sm">
                            Maintain the security of your account by changing
                            your password regularly. You can also enable
                            two-factor authentication for an extra layer of
                            protection.
                        </p>
                    </div>

                    {/* Password Change Section */}
                    <div className="mt-2 grid max-w-xl grid-cols-1 gap-6">
                        {/* Current Password */}
                        <p className="text-md text-theme-on-surface font-semibold md:text-lg">
                            Update Password
                        </p>
                        <PasswordInput
                            id={'current-password'}
                            name="currentPassword"
                            label="Current Password"
                        />
                        <PasswordInput
                            id={'new-password'}
                            name="newPassword"
                            label="New Password"
                            note="Must be at least 8 characters and include a mix
                                of letters, numbers, and symbols."
                        />
                        <PasswordInput
                            id={'confirm-new-password'}
                            name="confirmNewPassword"
                            label="Confirm New Password"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <FormController onCancel={handleCancel} saving={saving} />
            </form>
        </div>
    );
}
