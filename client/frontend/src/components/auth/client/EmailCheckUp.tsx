"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppError } from "@/errors";
import { useAuth } from "@/providers/AuthProviders";
import { CheckEmailResponse } from "@/types/auth";

const TOAST_OPTIONS = {
  position: "top-center",
} as const;

const INTENT_CONFIG = {
  signup: {
    ifExists: "Email already exists. Please try logging in.",
    ifNotExists: "Email is available. You can proceed to sign up.",
    shouldRedirect: (exists: boolean) => !exists,
  },
  signin: {
    ifExists: "Email found. Continue to sign in.",
    ifNotExists: "Email not found. Please sign up first.",
    shouldRedirect: (exists: boolean) => exists,
  },
} as const;

type Intent = keyof typeof INTENT_CONFIG;

interface Props {
  redirectTo: string;
}

export default function CheckEmailClientComponent({
  redirectTo,
}: Props) {
  const router = useRouter();
  const { checkEmailExists } = useAuth();

  const [email, setEmail] = useState("");

  const intent: Intent = redirectTo.includes("/signup")
    ? "signup"
    : "signin";

  const config = INTENT_CONFIG[intent];

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const value = email.trim();

    if (!value) return;

    try {
      const { exists }: CheckEmailResponse =
        await checkEmailExists(value);

      toast.success(
        exists ? config.ifExists : config.ifNotExists,
        TOAST_OPTIONS,
      );

      if (!config.shouldRedirect(exists)) {
        return;
      }

      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof AppError
          ? error.message
          : "Invalid email or something went wrong. Please try again.",
        TOAST_OPTIONS,
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="my-3 grid w-full grid-cols-1 space-y-4 md:space-y-6"
    >
      <div className="w-full rounded-full border border-theme-on-surface/20 p-3 px-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full outline-none"
          placeholder="Email"
          autoComplete="email"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-brand-depth/95 p-3 px-4 text-on-brand-depth transition hover:bg-brand-depth active:scale-[0.97]"
      >
        Continue
      </button>
    </form>
  );
}