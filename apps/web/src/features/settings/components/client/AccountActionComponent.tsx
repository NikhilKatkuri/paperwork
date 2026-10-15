'use client';

import { useState } from 'react';
import useAccountAction, {
    AccountActionService,
} from '../../api/accountAction';
import PasswordModal from '@/components/ui/PasswordModal';
import { toast } from 'sonner';

export default function AccountActionComponent() {
    const { saving, handleSubmit } = useAccountAction();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [action, setAction] = useState<AccountActionService['action'] | null>(
        null
    );
    const [modalError, setModalError] = useState<string | null>(null);

    async function handleConfirmPassword(password: string) {
        if (!action) return;
        setModalError(null);

        try {
            const response = await handleSubmit({ action, password });

            if (response.ok) {
                // Handle success directly
                setIsModalOpen(false);
                toast.success(response.data?.message || 'Action completed successfully.', {
                    position: 'top-right',
                    duration: 2000,
                });
            } else {
                // Handle API error response explicitly
                setModalError(response.error|| 'Failed to perform action.');
            }
        } catch (error) {
            if (error instanceof Error) {
                setModalError(error.message);
            } else {
                setModalError('An unknown error occurred.');
            }
        }
    }

    function handleAction(action: AccountActionService['action']) {
        setModalError(null);
        setAction(action);
        setIsModalOpen(true);
    }

    return (
        <>
            <div className="grid w-full grid-cols-1 gap-3">
                <h2 className="text-md font-semibold md:text-lg">
                    Deactivation and deletion
                </h2>
                <div className="grid gap-6">
                    <div className="grid items-center gap-6 xl:grid-cols-2">
                        <div className="grid">
                            <h1 className="font-bold">Deactivate account</h1>
                            <p className="text-sm">
                                Temporarily hide your profile and forms
                            </p>
                        </div>
                        <div className="flex w-full items-center justify-end">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleAction('deactivate-account')}
                                className="bg-theme-form-on-surface/10 hover:bg-theme-form-on-surface/90 h-14 rounded-full p-2 px-8 text-sm transition-all duration-200 hover:text-white"
                            >
                                Deactivate account
                            </button>
                        </div>
                    </div>
                    <div className="grid items-center gap-6 xl:grid-cols-2">
                        <div className="grid">
                            <h1 className="font-bold">
                                Delete your data and account
                            </h1>
                            <p className="text-sm">
                                Permanently delete your data and everything
                                associated with your account
                            </p>
                        </div>
                        <div className="flex w-full items-center justify-end">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleAction('delete-account')}
                                className="bg-theme-form-on-surface/10 hover:bg-theme-form-on-surface/90 h-14 rounded-full p-2 px-8 text-sm transition-all duration-200 hover:text-white"
                            >
                                Delete account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <PasswordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmPassword}
                isLoading={saving}
                error={modalError}
            />
        </>
    );
}