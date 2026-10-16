'use client';

import { ForgotPasswordResponse, ChangePasswordRequest } from '../types';
import { endpoints } from '@/api/endpoints';
import { useApiAction } from '@/hooks/useApiAction';
import { http } from '@/api/http';

const useChangePassword = () => {
    const { loading, execute: handleChangePassword } = useApiAction(
        async (credentials: ChangePasswordRequest) => {
            return await http.post<ForgotPasswordResponse>(
                endpoints.auth.changePassword,
                credentials
            );
        }
    );

    return { loading, handleChangePassword };
};

export default useChangePassword;
