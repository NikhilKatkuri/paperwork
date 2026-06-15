import { cn } from "@/utils/cn";
import LayoutConfig from "../ui/config"; 
import ResetPasswordContainer from "../client/containers/ResetPasswordContainer";

const ResetPasswordPage = () => {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <section className={cn(LayoutConfig.leftSection)}></section>
      <section className={cn(LayoutConfig.rightSection)}>
        <ResetPasswordContainer/>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
