"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers";

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

export default function CheckEmailClientComponent({ redirectTo }: Props) {
  const router = useRouter();
  const { emailCheck } = useAuth();
  const { loading, handleEmailCheckUp } = emailCheck;
  const [email, setEmail] = useState("");

  const intent: Intent = redirectTo.includes("/signup") ? "signup" : "signin";
  const config = INTENT_CONFIG[intent];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = email.trim();

    if (!value) return;

    const res = await handleEmailCheckUp({ email: value });

    if (res.ok) {
      const data = res.data;
      toast.success(
        data.exists ? config.ifExists : config.ifNotExists,
        TOAST_OPTIONS,
      );

      if (!config.shouldRedirect(data.exists)) {
        return;
      }

      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    } else {
      toast.error(res.error, TOAST_OPTIONS);
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
        disabled={loading}
        className="w-full rounded-full bg-brand-depth/95 p-3 px-4 text-on-brand-depth transition hover:bg-brand-depth active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "validating..." : "continue"}
      </button>
    </form>
  );
}
