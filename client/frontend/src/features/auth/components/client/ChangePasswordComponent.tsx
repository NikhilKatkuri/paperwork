"use client";
import { useAuth } from "@/providers";
import { validatePassword } from "@/utils/validations";
import { useState } from "react";
import { toast } from "sonner";

const ChangePasswordComponent = () => {
  const { changePassword } = useAuth();
  const { loading, handleChangePassword } = changePassword;

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setError(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const res = await handleChangePassword({
      newPassword: newPassword,
      currentPassword: password,
    });

    if (res.ok) {
      toast.success("Password updated successfully", {
        position: "top-center",
      });
    } else if (res.error) {
      toast.error(res.error, {
        position: "top-center",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="my-3 w-full grid grid-cols-1 space-y-4 md:space-y-6 transition-all ease-in-out duration-150"
    >
      <div className="">
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="password"
            className="w-full outline-0"
            placeholder="new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error.password && (
          <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>
        )}
      </div>
      <div className="">
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="password"
            className="w-full outline-0"
            placeholder="new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {error.newPassword && (
          <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>
        )}
      </div>
      <div className="">
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="password"
            className="w-full outline-0"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="confirm password"
          />
        </div>
        {error.confirmPassword && (
          <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth"
      >
        {loading ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
};

export default ChangePasswordComponent;
