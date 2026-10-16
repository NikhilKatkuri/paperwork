'use client';

import { ForgotPasswordResponse, ForgotPasswordRequest } from '../types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

const useForgotPassword = () => {
    const { loading, execute: handleForgotPassword } = useApiAction(
        async (credentials: ForgotPasswordRequest) => {
            return await http.post<ForgotPasswordResponse>(
                endpoints.auth.forgotPassword,
                credentials
            );
        }
    );

    return { loading, handleForgotPassword };
};

export default useForgotPassword;
