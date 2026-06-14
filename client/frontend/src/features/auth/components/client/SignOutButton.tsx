"use client";

import { useAuth } from "@/providers";
import { toast } from "sonner";

const SignOutButton = () => {
  const { signOut, accessToken, setAccessToken } = useAuth();
  const { loading, handleSignOut } = signOut;

  const handleSubmit = async () => {
    const result = await handleSignOut(accessToken ?? "");
    if (result.ok) {
      toast.success("Signed out successfully");
      setAccessToken(null);
    } else if (result.error) {
      toast.error(result.error);
    }
  };
  return (
    <button
      className="px-4 py-3 bg-brand-depth text-on-brand-depth"
      onClick={handleSubmit}
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
};

export default SignOutButton;
