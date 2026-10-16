'use client';

import { ForgotPasswordResponse, ResetPasswordRequest } from '../types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

const useResetPassword = () => {
    const { loading, execute: handleResetPassword } = useApiAction(
        async (credentials: ResetPasswordRequest, token: string) =>
            http.post<ForgotPasswordResponse>(
                endpoints.auth.resetPassword(token),
                credentials
            )
    );

    return { loading, handleResetPassword };
};

export default useResetPassword;
