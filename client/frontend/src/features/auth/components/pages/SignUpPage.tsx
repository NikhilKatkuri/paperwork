"use client";

import { cn } from "@/utils/cn";
import LayoutConfig from "../ui/config";
import Navbar from "../client/Navbar";
import { redirect, useSearchParams } from "next/navigation";
import CheckEmailContainer from "../client/containers/CheckEmailContainer";
import SignUpContainer from "../client/containers/SignUpContainer";

function renderStep(step: number) {
  switch (step) {
    case 1:
      return <CheckEmailContainer />;
    case 2:
      return <SignUpContainer />;
    default:
      return <CheckEmailContainer />;
  }
}

const SignUpPage = () => {
  const params = useSearchParams();
  const currentStep = params.has("step")
    ? parseInt(params.get("step") as string)
    : 1;
  if (!params.has("email") && currentStep === 2) {
    redirect("/auth/signup?step=1");
  }

  return (
    <div className={cn(LayoutConfig.layout)}>
      <section className={cn(LayoutConfig.leftSection)}></section>
      <section className={cn(LayoutConfig.rightSection)}>
        <Navbar />
        {renderStep(currentStep)}
      </section>
    </div>
  );
};

export default SignUpPage;
