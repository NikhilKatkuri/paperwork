"use client";
import AuthLayout from "@/components/auth/Layout";
import Image from "next/image";
import Link from "next/link";

function page() {
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
            Create without limits
          </h1>
          <p className="text-md md:text-lg">
            Sign in to Paperwork to build beautiful, conversational forms and
            surveys in seconds.
          </p>
        </div>
        <div className="my-3 w-full grid grid-cols-1 space-y-4 md:space-y-6 transition-all ease-in-out duration-150">
          <div className="">
            <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
              <input
                type="text"
                className="w-full outline-0"
                placeholder="Email"
              />
            </div>
            {false && (
              <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>
            )}
          </div>
          <div className="">
            <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
              <input
                type="password"
                className="w-full outline-0"
                placeholder="Password"
              />
            </div>
            {false && (
              <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>
            )}
          </div>
          <button className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth">
            Sign In
          </button>
        </div>
        <footer className="my-3 w-full grid grid-cols-1 space-y-3">
         
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

export default page;
