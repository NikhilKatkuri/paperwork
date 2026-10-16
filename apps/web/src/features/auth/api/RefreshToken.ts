'use client';
import { RefreshTokenResponse } from '@/auth/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

function useRefreshToken() {
    const { loading, execute: handleRefreshToken } = useApiAction(async () =>
        http.post<RefreshTokenResponse>(endpoints.auth.refreshToken)
    );

    return { loading, handleRefreshToken };
}
export default useRefreshToken;
