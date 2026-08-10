'use client';

import {
    createContext,
    useContext,
    ReactNode,
    useState,
    useRef,
    useEffect,
    useCallback,
} from 'react';

import useSignIn from '@/auth/functions/SignIn';
import useEmailCheckUp from '@/auth/functions/CheckEmail';
import useSignUp from '../functions/SignUp';
import useSignOut from '../functions/SignOut';
import useRefreshToken from '../functions/RefreshToken';
import useChangePassword from '../functions/ChangePassword';
import useResetPassword from '../functions/ResetPassword';
import useForgotPassword from '../functions/ForgotPassword';
import { http } from '@/api/http';
import { getCachedProfile, loadProfile } from '../functions/loadProfile';
import { PublicProfile } from '@/types';
import jwtDecode, { DecodedTokenWithMeta } from '@/utils/jwtDecode';
import useTwoFactorAuth from '../functions/TwoFactorAuth';

export function useAuthLogic() {
    const signIn = useSignIn();
    const signUp = useSignUp();
    const signOut = useSignOut();
    const emailCheck = useEmailCheckUp();
    const refreshToken = useRefreshToken();
    const changePassword = useChangePassword();
    const resetPassword = useResetPassword();
    const forgotPassword = useForgotPassword();
    const twoFactorAuth = useTwoFactorAuth();
    return {
        signIn,
        signUp,
        signOut,
        emailCheck,
        refreshToken,
        changePassword,
        resetPassword,
        forgotPassword,
        twoFactorAuth,
    };
}

type AuthContextType = ReturnType<typeof useAuthLogic> & {
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    initializing: boolean;
    publicProfile: PublicProfile | null;
    setPublicProfile: React.Dispatch<
        React.SetStateAction<PublicProfile | null>
    >;
    decodedToken: DecodedTokenWithMeta | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getExpiryMs(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuthLogic();
    const { handleRefreshToken } = auth.refreshToken;

    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
        null
    );
    const [decodedToken, setDecodedToken] =
        useState<DecodedTokenWithMeta | null>(null);

    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleRefreshTokenRef = useRef(handleRefreshToken);
    const isMountedRef = useRef(true);
    const tokenRef = useRef<string | null>(accessToken);
    const scheduleRefreshRef = useRef<(token: string) => void>(() => {});

    const scheduleRefresh = useCallback((token: string) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        const expiryMs = getExpiryMs(token);
        if (!expiryMs) return;

        const delay = expiryMs - Date.now() - 60 * 1000;

        refreshTimerRef.current = setTimeout(
            async () => {
                const res = await handleRefreshTokenRef.current();
                if (!isMountedRef.current) return;

                if (res.ok) {
                    setAccessTokenState(res.data.accessToken);
                    scheduleRefreshRef.current(res.data.accessToken);
                } else {
                    setAccessTokenState(null);
                }
            },
            Math.max(delay, 0)
        );
    }, []);

    const updateAccessToken = useCallback(
        (token: string | null) => {
            setAccessTokenState(token);
            if (token) {
                scheduleRefresh(token);
            } else if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        },
        [scheduleRefresh]
    );

    useEffect(() => {
        handleRefreshTokenRef.current = handleRefreshToken;
    }, [handleRefreshToken]);

    useEffect(() => {
        tokenRef.current = accessToken;
    }, [accessToken]);

    useEffect(() => {
        scheduleRefreshRef.current = scheduleRefresh;
    }, [scheduleRefresh]);

    useEffect(() => {
        isMountedRef.current = true;

        async function initAuth() {
            try {
                const res = await handleRefreshTokenRef.current();
                if (!isMountedRef.current) return;
                if (res?.ok && res?.data?.accessToken) {
                    updateAccessToken(res.data.accessToken);
                } else {
                    updateAccessToken(null);
                }
            } catch {
                if (isMountedRef.current) {
                    updateAccessToken(null);
                }
            } finally {
                if (isMountedRef.current) {
                    setInitializing(false);
                }
            }
        }

        initAuth();

        return () => {
            isMountedRef.current = false;
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, [updateAccessToken]);

    useEffect(() => {
        http.registerTokenGetter(() => tokenRef.current);
    }, []);

    useEffect(() => {
        function updateDecodedToken() {
            if (!accessToken) {
                setDecodedToken(null);
                return;
            }

            const { decodedToken: tokenData, isExpired } =
                jwtDecode<DecodedTokenWithMeta>(accessToken);

            if (!isExpired && tokenData) {
                setDecodedToken(tokenData);
            } else {
                setDecodedToken(null);
            }
        }
        updateDecodedToken();
    }, [accessToken]);

    useEffect(() => {
        let cancelled = false;
        const userId = decodedToken?.userId;

        function updateProfile() {
            if (!userId) {
                setPublicProfile(null);
                return;
            }

            const cached = getCachedProfile();

            if (cached) {
                setPublicProfile(cached);
                return;
            }

            loadProfile().then((profile) => {
                if (!cancelled && profile) {
                    setPublicProfile(profile);
                }
            });
        }
        updateProfile();
        return () => {
            cancelled = true;
        };
    }, [decodedToken?.userId]);

    return (
        <AuthContext.Provider
            value={{
                ...auth,
                accessToken,
                setAccessToken: updateAccessToken,
                initializing,
                publicProfile,
                setPublicProfile,
                decodedToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error(
            'useAuth must be used within an AuthProvider execution tree'
        );
    }
    return context;
}
