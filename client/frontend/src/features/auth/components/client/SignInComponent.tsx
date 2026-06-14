"use client";

import { useAuth } from "@/providers";
import { validateEmail, validatePassword } from "@/utils/validations";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ToastOptions = {
  duration: 4000,
  position: "top-center",
} as const;

const SignInClientComponent = () => {
  const { signIn ,setAccessToken} = useAuth();
  const { loading, handleSignIn } = signIn;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inUse = useRef(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    inUse.current = true;
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const res = await handleSignIn({ email, password });

    if (res.ok) {
      toast.success("Signed in successfully!", ToastOptions);
      setAccessToken(res.data.accessToken);
    } else {
      toast.error(res.error, ToastOptions);
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
        {fieldErrors.email && (
          <p className="text-xs text-red-500 mt-2 px-3">{fieldErrors.email}</p>
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
        {fieldErrors.password && (
          <p className="text-xs text-red-500 mt-2 px-3">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
};

export default SignInClientComponent;
