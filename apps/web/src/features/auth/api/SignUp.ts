'use client';

import { SignUpRequestBody, SignUpResponse } from '@/auth/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

function useSignUp() {
    const { loading, execute: handleSignUp } = useApiAction(
        async (credential: SignUpRequestBody) =>
            http.post<SignUpResponse>(endpoints.auth.signUp, credential)
    );

    return {
        loading,
        handleSignUp,
    };
}

export default useSignUp;
