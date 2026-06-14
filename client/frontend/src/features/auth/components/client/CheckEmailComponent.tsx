"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthLogic } from "@/providers";
import {
  EmailCheckResponse,
  ForgotPasswordResponse,
} from "@/auth/types/api.response.types";
import { validateEmail } from "@/utils/validations";
import { INTENT_CONFIG } from "@/auth/constants/data";
import AuthFlow from "@/auth/constants/config";
import getIntentFromPathname from "../utils/lookups";

const TOAST_OPTIONS = {
  position: "top-center",
} as const;

function isEmailCheckResponse(
  data: EmailCheckResponse | ForgotPasswordResponse,
): data is EmailCheckResponse {
  return "exists" in data;
}

export default function CheckEmailClientComponent() {
  const params = useParams();
  const currentStep = params?.step ? parseInt(params.step as string) : 1;
  const currentStepIndex = Math.max(0, currentStep - 1);
  const pn = usePathname();
  const intent = getIntentFromPathname(pn);

  const authLogic = useAuthLogic();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const methods = AuthFlow[intent]?.[currentStepIndex];
  const config = INTENT_CONFIG[intent as keyof typeof INTENT_CONFIG];

  function handleFlow() {
    if (!methods.next) return;
    setTimeout(() => {
      toast.loading("Redirecting...", {
        ...TOAST_OPTIONS,
        duration: 100,
      });
    }, 800);

    setTimeout(() => {
      toast.dismiss();
      if (methods.next) {
        router.push(methods.next(email));
      }
    }, 2000);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newError = validateEmail(email);
    if (newError) {
      toast.error(newError, TOAST_OPTIONS);
      return;
    }

    setLoading(true);
    let res;

    try {
      switch (intent) {
        case "forgotPassword":
          const { handleForgotPassword } = authLogic.forgotPassword;
          res = await handleForgotPassword({ email });
          break;
        default:
          const { handleEmailCheck } = authLogic.emailCheck;
          res = await handleEmailCheck({ email });
      }

      if (!res || !res.ok) {
        toast.error(res?.error || "Something went wrong", TOAST_OPTIONS);
        setLoading(false);
        return;
      }

      const data = res.data;
      let shouldRedirect = false;

      if (isEmailCheckResponse(data)) {
        toast.success(data.exists ? config.ifExists : config.ifNotExists, {
          ...TOAST_OPTIONS,
          duration: 1500,
        });
        shouldRedirect = !!methods?.conditionToRedirect(data.exists);
      } else { 
        toast.success(data.message, TOAST_OPTIONS);
        shouldRedirect = !!methods?.conditionToRedirect(data.success);
      }

      if (shouldRedirect) {
        handleFlow();
      }
    } catch {
      toast.error("An unexpected error occurred", TOAST_OPTIONS);
    } finally {
      setLoading(false);
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
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-depth/95 p-3 px-4 text-on-brand-depth transition hover:bg-brand-depth active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Validating..." : "Continue"}
      </button>
    </form>
  );
}
