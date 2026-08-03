"use client";
import CheckEmailClientComponent from "@/auth/components/client/CheckEmailComponent";
import Image from "next/image";
import Link from "next/link";
import { INTENT_EMAIL_CONFIG } from "@/auth/constants/data";
import { usePathname } from "next/navigation";
import getIntentFromPathname from "../../utils/lookups";

function CheckEmailContainer() {
  const pn = usePathname();
  const intent = getIntentFromPathname(pn);
  const data = INTENT_EMAIL_CONFIG[intent];

  return (
    <div className="flex flex-col space-y-5 w-full h-full justify-center ">
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
          {data.title}
        </h1>
        <p className="text-md md:text-lg">{data.subtitle}</p>
      </div>
      <CheckEmailClientComponent />
      <footer className="my-3 w-full grid grid-cols-1 space-y-3 select-none">
        <p className="text-xs text-center">
          {data.footerText}{" "}
          <Link
            href={data.footerTarget}
            className="text-brand-depth font-medium hover:underline"
          >
            {data.footerLinkText}
          </Link>
        </p>
        {intent === "signIn" && (
          <p className="text-xs text-center">
            Forgot your password?{" "}
            <Link
              href="/auth/forgot-password"
              className="text-brand-depth font-medium hover:underline"
            >
              Reset it here
            </Link>
          </p>
        )}
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
  );
}

export default CheckEmailContainer; 

