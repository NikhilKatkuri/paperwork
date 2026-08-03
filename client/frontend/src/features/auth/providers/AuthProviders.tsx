"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import useSignIn from "@/auth/functions/SignIn";
import useEmailCheckUp from "@/auth/functions/CheckEmail";
import useSignUp from "../functions/SignUp";
import useSignOut from "../functions/SignOut";
import useRefreshToken from "../functions/RefreshToken";
import useChangePassword from "../functions/ChangePassword";
import useResetPassword from "../functions/ResetPassword";
import useForgotPassword from "../functions/ForgotPassword";
import api from "@/api/useApi";

export function useAuthLogic() {
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();
  const emailCheck = useEmailCheckUp();
  const refreshToken = useRefreshToken();
  const changePassword = useChangePassword();
  const resetPassword = useResetPassword();
  const forgotPassword = useForgotPassword();

  return {
    signIn,
    signUp,
    signOut,
    emailCheck,
    refreshToken,
    changePassword,
    resetPassword,
    forgotPassword,
  };
}

type AuthContextType = ReturnType<typeof useAuthLogic> & {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRefreshTokenRef = useRef(handleRefreshToken);
  const scheduleRefreshRef = useRef<(token: string) => void>(() => {});

  useEffect(() => {
    handleRefreshTokenRef.current = handleRefreshToken;
  }, [handleRefreshToken]);

  // Define scheduleRefresh safely using a stable callback
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const expiryMs = getExpiryMs(token);
    if (!expiryMs) return;

    const delay = expiryMs - Date.now() - 60 * 1000;

    refreshTimerRef.current = setTimeout(
      async () => {
        const res = await handleRefreshTokenRef.current();
        if (res.ok) {
          setAccessTokenState(res.data.accessToken);
          // Use the ref version to avoid closure hoisting issues
          scheduleRefreshRef.current(res.data.accessToken);
        } else {
          setAccessTokenState(null);
          api.setBearer("");
        }
      },
      Math.max(delay, 0),
    );
  }, []);

  // Keep scheduleRefreshRef updated with the latest function instance
  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  const updateAccessToken = useCallback(
    (token: string | null) => {
      setAccessTokenState(token);
      if (token) {
        scheduleRefresh(token);
      } else if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    },
    [scheduleRefresh],
  );

  useEffect(() => {
    let isMounted = true;

    handleRefreshTokenRef.current().then((res) => {
      if (!isMounted) return;
      if (res.ok) {
        updateAccessToken(res.data.accessToken);
      }
      setInitializing(false);
    });

    return () => {
      isMounted = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [updateAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        accessToken,
        setAccessToken: updateAccessToken,
        initializing,
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
      "useAuth must be used within an AuthProvider execution tree",
    );
  }
  return context;
}
