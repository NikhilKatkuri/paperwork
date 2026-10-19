'use client';
import { RefreshTokenResponse } from '@/auth/types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';

function useRefreshToken() {
    const { loading, execute: handleRefreshToken } = useApiAction(async () =>
        http.post<RefreshTokenResponse>(
            endpoints.auth.refreshToken,
            undefined,
            // The refresh call is what settles the session bootstrap; it must
            // never wait behind the gate it is responsible for releasing.
            { skipSessionGate: true }
        )
    );

    return { loading, handleRefreshToken };
}
export default useRefreshToken;
