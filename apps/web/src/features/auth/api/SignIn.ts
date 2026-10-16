'use client';

import { SignInRequestBody, SignInResponse } from '@/auth/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

function useSignIn() {
    const { loading, execute: handleSignIn } = useApiAction(
        async (credential: SignInRequestBody) =>
            http.post<SignInResponse>(endpoints.auth.signIn, credential)
    );

    return {
        loading,
        handleSignIn,
    };
}

export default useSignIn;
