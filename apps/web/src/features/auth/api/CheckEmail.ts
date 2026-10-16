'use client';

import { EmailCheckRequestBody, EmailCheckResponse } from '../types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

function useEmailCheckUp() {
    const { loading, execute: handleEmailCheck } = useApiAction(
        async (credential: EmailCheckRequestBody) => {
            return await http.post<EmailCheckResponse>(
                endpoints.auth.checkEmailExists,
                credential
            );
        }
    );

    return {
        loading,
        handleEmailCheck,
    };
}

export default useEmailCheckUp;
