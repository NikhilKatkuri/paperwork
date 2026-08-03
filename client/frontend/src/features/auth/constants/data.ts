import { AuthIntent } from "../types";

interface IntentProps {
  ifExists: string;
  ifNotExists: string;
  hasAuditFunc?: boolean;
}

export const INTENT_CONFIG: Record<AuthIntent, IntentProps> = {
  signUp: {
    ifExists: "Email already exists. Please try logging in.",
    ifNotExists: "Email is available. You can proceed to sign up.",
  },

  signIn: {
    ifExists: "Email found. Continue to sign in.",
    ifNotExists: "Email not found. Please sign up first.",
  },

  forgotPassword: {
    ifExists: "Email found. You can reset your password.",
    ifNotExists: "Email not found. Please sign up first.",
  },
};

interface Props {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerTarget: string;
}

export const INTENT_EMAIL_CONFIG: Record<AuthIntent, Props> = {
  signUp: {
    title: "Create without limits",
    subtitle:
      "Join Paperwork to build beautiful, logic-driven conversational forms and surveys in seconds.",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerTarget: "/auth/signin?step=1",
  },
  signIn: {
    title: "Welcome back",
    subtitle:
      "Sign in to your workspace to continue building and managing your conversational forms.",
    footerText: "Don't have an account?",
    footerLinkText: "Sign up for free",
    footerTarget: "/auth/signup?step=1",
  },
  forgotPassword: {
    title: "Reset your password",
    subtitle:
      "Enter your email address and we'll send you a link to reset your password.",
    footerText: "Remember your password?",
    footerLinkText: "Sign in",
    footerTarget: "/auth/signin?step=1",
  },
};
