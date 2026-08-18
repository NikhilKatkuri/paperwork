import { PublicProfile } from '@/types';
import { DecodedTokenWithMeta } from '@/utils/jwtDecode';

export interface AuthStepsConfig {
    step: number;
    conditionToRedirect: (arg: boolean) => boolean;
    next: ((arg: string) => string) | null;
}

export type AuthIntent = 'signUp' | 'signIn' | 'forgotPassword';

export type AuthContextType<T> = T & {
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    initializing: boolean;
    publicProfile: PublicProfile | null;
    setPublicProfile: React.Dispatch<
        React.SetStateAction<PublicProfile | null>
    >;
    decodedToken: DecodedTokenWithMeta | null;
};

export type ApiResponse<T> =
    { ok: true; data: T } | { ok: false; error: string };

export * from './api.request';
export * from './api.response';
