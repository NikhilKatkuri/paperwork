"use client";
import CheckEmailClientComponent from "@/components/auth/client/EmailCheckUp";
import AuthLayout from "@/components/auth/Layout";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const INTENT = {
  signup: {
    title: "Create without limits",
    subtitle:
      "Join Paperwork to build beautiful, logic-driven conversational forms and surveys in seconds.",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerTarget: "/auth/check-email?redirect=/auth/signin",
  },
  signin: {
    title: "Welcome back",
    subtitle:
      "Sign in to your workspace to continue building and managing your conversational forms.",
    footerText: "Don't have an account?",
    footerLinkText: "Sign up for free",
    footerTarget: "/auth/check-email?redirect=/auth/signup",
  },
};

function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect");

  useEffect(() => {
    if (!redirectTo) {
      router.replace("/auth/check-email?redirect=/auth/signup");
    }
  }, [redirectTo, router]);

  if (!redirectTo) {
    return null;
  }
  const next = redirectTo.includes("/auth/signup") ? "signup" : "signin";

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-5 w-full h-full justify-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Image
              src="/paperwork_icon-vector-master.svg"
              alt="paperwork-icon-vector-master"
              width={32}
              height={32}
              className=""
            />
            <p className="text-lg font-medium my-3">Paper Work</p>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold md:font-medium">
            {INTENT[next].title}
          </h1>
          <p className="text-md md:text-lg">{INTENT[next].subtitle}</p>
        </div>
        <CheckEmailClientComponent redirectTo={redirectTo} />
        <footer className="my-3 w-full grid grid-cols-1 space-y-3">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            {INTENT[next].footerText}{" "}
            {
              <Link
                href={INTENT[next].footerTarget}
                className="text-indigo-600 font-medium hover:underline"
              >
                {INTENT[next].footerLinkText}
              </Link>
            }
          </p>
          <div className="flex items-center justify-center text-xs text-center gap-3 w-full">
            <Link href={""} className="hover:underline active:underline">
              Terms of Use
            </Link>
            <Link href={""} className="hover:underline active:underline">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </AuthLayout>
  );
}

export default Page;
