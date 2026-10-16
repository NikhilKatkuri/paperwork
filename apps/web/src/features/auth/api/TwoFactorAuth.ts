'use client';

import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { SignInResponse } from '../types';

export default function useTwoFactorAuth() {
    const { loading, execute: handler } = useApiAction(async (otp: string) =>
        http.post<SignInResponse>(endpoints.auth.verifyTwoFactor(otp))
    );

    return {
        loading,
        handler,
    };
}
