"use client";

import AuthServices from "@/services/auth";
import { CheckEmailResponse, SignInProps, SignUpProps, SignUpResponse } from "@/types/auth";
import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  signIn: (data: SignInProps) => Promise<void>;
  signUp: (data: SignUpProps) => Promise<SignUpResponse>;
  checkEmailExists: (email: string) => Promise<CheckEmailResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const methods = new AuthServices();
  return (
    <AuthContext.Provider
      value={{ signIn: methods.signIn, signUp: methods.signUp, checkEmailExists: methods.checkEmailExists }}
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
