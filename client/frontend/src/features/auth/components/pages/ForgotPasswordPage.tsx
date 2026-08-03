import { cn } from "@/utils/cn";
import LayoutConfig from "../ui/config";
import Navbar from "../client/Navbar"; 
import CheckEmailContainer from "../client/containers/CheckEmailContainer";
 
const ForgotPasswordPage = () => {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <section className={cn(LayoutConfig.leftSection)}></section>
      <section className={cn(LayoutConfig.rightSection)}>
        <Navbar />
        <CheckEmailContainer />
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
