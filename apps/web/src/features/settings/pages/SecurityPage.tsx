'use client';

import { useEffect, useState } from 'react';
import useAccountMetaOnly from '../api/getAccount';
import useAccountAction from '../api/accountAction';
import PasswordModal from '@/components/ui/PasswordModal';
export default function SecurityPage() {
    const { loading: metaLoading, accountMeta } = useAccountMetaOnly();
    const { saving: accountActionSaving, handleSubmit: accountAction } =
        useAccountAction();

    const [initialTwoFactor, setInitialTwoFactor] = useState<boolean | null>(
        null
    );
    const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);

    // Modal and Feedback States
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchAccountMeta() {
            const accountData = await accountMeta();
            if (isMounted && accountData) {
                setInitialTwoFactor(accountData.twofactorEnabled);
                setTwoFactorEnabled(accountData.twofactorEnabled);
            }
        }
        fetchAccountMeta();
        return () => {
            isMounted = false;
        };
    }, [accountMeta]);

    const isDirty =
        initialTwoFactor !== null && twoFactorEnabled !== initialTwoFactor;

    // 1. Triggered when clicking "Save Changes" -> Opens the Modal
    const handleOpenConfirmation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty || accountActionSaving) return;
        setModalError(null);
        setSuccessMessage(null);
        setIsModalOpen(true);
    };

    // 2. Triggered inside the Modal when submitting password
    const handleConfirmPassword = async (password: string) => {
        setModalError(null);

        const res = await accountAction({
            action: twoFactorEnabled ? 'enable-2fa' : 'disable-2fa',
            password,
        });

        if (res?.ok) {
            setInitialTwoFactor(twoFactorEnabled);
            setIsModalOpen(false); // Close dialog on success
            setSuccessMessage(
                res.data.message || 'Security settings updated successfully.'
            );
        } else {
            // Keep modal open and show error inside the modal
            setModalError(res?.error || 'Invalid password or update failed.');
        }
    };

    const handleCancel = () => {
        if (initialTwoFactor !== null) {
            setTwoFactorEnabled(initialTwoFactor);
        }
        setSuccessMessage(null);
    };

    const isLoading = metaLoading || initialTwoFactor === null;

    return (
        <div className="h-full w-full scrollbar-none overflow-y-auto rounded-xl px-2">
            <form
                onSubmit={handleOpenConfirmation}
                className="flex flex-1 flex-col justify-between gap-6"
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-theme-on-surface text-lg font-bold md:text-xl">
                            Security
                        </h1>
                        <p className="text-theme-on-surface/80 md:text-md text-sm">
                            Make changes to your personal information or account
                            security.
                        </p>
                    </div>

                    <div className="mt-2 grid max-w-xl grid-cols-1 gap-6">
                        <div className="grid w-full grid-cols-1 gap-3">
                            <div>
                                <h2 className="text-md font-semibold md:text-lg">
                                    Two-factor authentication
                                </h2>
                                <p className="mt-2">
                                    This makes your account extra secure.
                                </p>
                            </div>

                            {isLoading ? (
                                <div className="border-theme-skeletion-surface shimmer h-8 w-full rounded-md border-[0.1]"></div>
                            ) : (
                                <label className="grid cursor-pointer grid-cols-[20px_1fr] items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorEnabled}
                                        onChange={(e) =>
                                            setTwoFactorEnabled(
                                                e.target.checked
                                            )
                                        }
                                        disabled={accountActionSaving}
                                        className="size-6 rounded-xl"
                                    />
                                    <span>Require code at login</span>
                                </label>
                            )}

                            {successMessage && (
                                <p className="mt-2 text-sm font-medium text-green-500">
                                    {successMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex w-full items-center justify-end gap-4 pt-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={!isDirty || accountActionSaving}
                        className="bg-theme-form-on-surface/10 text-theme-on-surface hover:bg-theme-form-on-surface/90 rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isDirty || accountActionSaving}
                        className="bg-theme-form-container-active/80 text-on-brand-depth hover:bg-theme-form-container-active rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>
            </form>

            {/* Password Modal Dialog */}
            <PasswordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmPassword}
                isLoading={accountActionSaving}
                error={modalError}
            />
        </div>
    );
}
