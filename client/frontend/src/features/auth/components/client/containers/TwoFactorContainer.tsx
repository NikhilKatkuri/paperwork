import Image from "next/image";
import Link from "next/link";
import OTPInput from "../../ui/otp";

function TwoFactorComponent() {
  return (
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
          Let&apos;s get verified!
        </h1>
        <p className="text-md md:text-lg">
          To ensure the security of your account, we request you to enter the
          OTP sent to your registered email address.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 w-full">
        <OTPInput />
        <button
          type="submit"
          className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth"
        >
          {false ? "Signing In..." : "Sign In"}
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
  );
}
export default TwoFactorComponent;
