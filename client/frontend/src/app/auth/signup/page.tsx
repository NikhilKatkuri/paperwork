 
import SignUpClientComponent from "@/components/auth/client/SignUp";
import AuthLayout from "@/components/auth/Layout";
import Image from "next/image";
import Link from "next/link";

function page() {
  return (
    <AuthLayout>
      <div className="flex flex-col space-y-5 w-full h-full items-center  justify-center">
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
            Build your first form
          </h1>
          <p className="text-md md:text-lg">
            Sign up to unlock logic-driven questions, real-time response
            analytics, and gorgeous templates.
          </p>
        </div>
        <SignUpClientComponent />
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
