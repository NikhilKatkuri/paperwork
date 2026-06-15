"use client";

import { useAuth } from "@/providers";
import { validateEmail, validatePassword } from "@/utils/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface ResetPasswordComponentProps {
  token: string;
  email: string;
  onSuccess: () => void;
  onError: () => void;
}

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col space-y-5 w-full h-full items-center justify-center max-w-md mx-auto p-4">
      <div className="flex flex-col gap-2 text-center items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/paperwork_icon-vector-master.svg"
            alt="Paper Work Logo"
            width={32}
            height={32}
          />
          <p className="text-lg font-medium my-3">Paper Work</p>
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Reset Your Password
        </h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Please confirm your registered account email address and create a strong new password below.
        </p>
      </div>
      {children}
      <footer className="my-3 w-full grid grid-cols-1 space-y-3">
        <div className="flex items-center justify-center text-xs text-center gap-3 w-full text-gray-400">
          <Link href="/terms" className="hover:underline active:underline">
            Terms of Use
          </Link>
          <Link href="/privacy" className="hover:underline active:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
};

const TOAST_OPTIONS = {
  duration: 4000,
  position: "top-center" as const,
}

const ResetPasswordComponent = ({
  token,
  email: initialEmail,
  onSuccess,
  onError,
}: ResetPasswordComponentProps) => {
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<Record<string, string>>({});

  const { resetPassword } = useAuth();
  const { loading, handleResetPassword } = resetPassword;

  function validateFields(): boolean {
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    } else if (email.toLowerCase().trim() !== initialEmail.toLowerCase().trim()) {
      newErrors.email = "Email does not match the one associated with this reset link.";
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    try {
      const res = await handleResetPassword({ newPassword }, token);
      if (res.ok) {
        toast.success(
          "Password reset successful! Please log in with your new password.",
          TOAST_OPTIONS
        );
        onSuccess();
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Something went wrong. Please check your link or try again.");
      onError();
    }
  };

  return (
    <Wrapper>
      <form
        onSubmit={handleSubmit}
        className="my-3 w-full grid grid-cols-1 space-y-4 md:space-y-6 transition-all ease-in-out duration-150"
      >
        <div>
          <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20 bg-white">
            <input
              type="text"
              className="w-full outline-0 text-sm"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error.email && (
            <p className="text-xs text-red-500 mt-2 px-4">{error.email}</p>
          )}
        </div>

        <div>
          <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20 bg-white">
            <input
              type="password"
              className="w-full outline-0 text-sm"
              placeholder="Create Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {error.newPassword && (
            <p className="text-xs text-red-500 mt-2 px-4">{error.newPassword}</p>
          )}
        </div>

        <div>
          <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20 bg-white">
            <input
              type="password"
              className="w-full outline-0 text-sm"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error.confirmPassword && (
            <p className="text-xs text-red-500 mt-2 px-4">{error.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth font-medium text-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>
      </form>
    </Wrapper>
  );
};

export default ResetPasswordComponent;