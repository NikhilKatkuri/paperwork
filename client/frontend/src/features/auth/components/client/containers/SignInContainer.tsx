import SignInClientComponent from "../SignInComponent";
import Link from "next/link";
import Image from "next/image";

const SignInContainer = () => {
  
  return (
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
      <SignInClientComponent />
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
};

export default SignInContainer;
