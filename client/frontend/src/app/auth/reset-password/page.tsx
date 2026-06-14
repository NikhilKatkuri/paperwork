import { redirect } from "next/dist/client/components/navigation";

function page() {
   redirect("/auth/forgot-password?step=1");
}

export default page