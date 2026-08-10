import { useState } from 'react';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { validatePassword } from '@/utils/validations';
import { AxiosError } from 'axios';

interface ChangePasswordProps {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    abortSignal?: AbortSignal | null;
}

export default function usePasswordChange() {
    const [saving, setSaving] = useState<boolean>(false);

    const changePassword = async ({
        currentPassword,
        newPassword,
        confirmNewPassword,
        abortSignal,
    }: ChangePasswordProps) => {
        setSaving(true);

        try {
            const cpe = validatePassword(currentPassword);
            const npe = validatePassword(newPassword);
            const cnpe = validatePassword(confirmNewPassword);

            if (cpe || npe || cnpe) {
                throw new Error(
                    cpe || npe || cnpe || 'Invalid password inputs.'
                );
            }

            if (currentPassword === newPassword) {
                throw new Error(
                    'New password cannot be the same as the current password.'
                );
            }

            if (newPassword !== confirmNewPassword) {
                throw new Error(
                    'New password and confirm password do not match.'
                );
            }

            const { path } = endpoints.auth.changePassword;

            const response = await http.post(
                path,
                {
                    currentPassword,
                    newPassword,
                },
                {
                    ...(abortSignal ? { signal: abortSignal } : {}),
                }
            );

            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (
                    error?.name === 'CanceledError' ||
                    error?.name === 'AbortError'
                ) {
                    console.log('Password change request was aborted.');
                    return;
                }

                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    'An unknown error occurred during password change.';

                throw new Error(message);
            }

            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error(
                'An unknown error occurred during password change.'
            );
        } finally {
            setSaving(false);
        }
    };

    return {
        saving,
        changePassword,
    };
}
