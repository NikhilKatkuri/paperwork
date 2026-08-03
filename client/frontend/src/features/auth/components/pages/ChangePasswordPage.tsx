import { cn } from "@/utils/cn";
import Image from "next/image";
import LayoutConfig from "../ui/config";
import Navbar from "../client/Navbar";
import ChangePasswordComponent from "../client/ChangePasswordComponent";

function ChangePasswordPage() {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <section className={cn(LayoutConfig.leftSection)}></section>
      <section className={cn(LayoutConfig.rightSection)}>
        <Navbar />
        <div className="flex flex-col space-y-5 w-full h-full items-center justify-center ">
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
              Update your password
            </h1>
            <p className="text-md md:text-lg">
              Enter your new password below to update your account credentials.
            </p>
          </div>
          <ChangePasswordComponent />
        </div>
      </section>
    </div>
  );
}

export default ChangePasswordPage;
