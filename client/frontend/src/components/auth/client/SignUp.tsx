"use client";

import { AppError } from "@/errors";
import { useAuth } from "@/providers/AuthProviders";
import {
  validateEmail,
  validatePassword,
  validateString,
} from "@/utils/validations";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ToastOptions = {
  duration: 4000,
  position: "top-center",
} as const;

const SignUpClientComponent = () => {
  const signUp = useAuth().signUp;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inUse = useRef(false);
  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    inUse.current = true;
    setLoading(true);
    e.preventDefault();

    try {
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      const nameError = validateString(fullName, "fullName");

      const newErrors: Record<string, string> = {};
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;
      if (nameError) newErrors.fullName = nameError;

      setErrors(newErrors);

      const hasErrors = Object.keys(newErrors).length > 0;
      if (hasErrors) return;

      const res = await signUp({
        email,
        password,
        fullName,
      });

      if (res && res.success) {
        toast.success(res.message || "Sign up successful!", ToastOptions);
      }
      console.log(res.accessToken);
    } catch (error) {
      console.error("Error during sign up:", error);

      if (error instanceof AppError) {
        toast.error(error.message, ToastOptions);
        return;
      } 


      toast.error(
        "An unexpected error occurred. Please try again.",
        ToastOptions,
      );
    } finally {
      inUse.current = false;
      setLoading(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="my-3 w-full grid grid-cols-1 space-y-4 md:space-y-6 transition-all ease-in-out duration-150"
    >
      <div>
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full outline-0"
            placeholder="Email"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 mt-2 px-3">{errors.email}</p>
        )}
      </div>
      <div>
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full outline-0"
            placeholder="Full Name"
          />
        </div>
        {errors.fullName && (
          <p className="text-xs text-red-500 mt-2 px-3">{errors.fullName}</p>
        )}
      </div>
      <div className="">
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="password"
            className="w-full outline-0"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-2 px-3">{errors.password}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth"
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
    </form>
  );
};

export default SignUpClientComponent;
