import { cn } from "@/utils/cn";
import LayoutConfig from "../ui/config";
import TwoFactorContainer from "../client/containers/TwoFactorContainer";

function TwoFactorAuthPage() {
      return (
        <div className={cn(LayoutConfig.layout)}>
          <div className={cn(LayoutConfig.leftSection)}></div>
          <div className={cn(LayoutConfig.rightSection)}>
            <TwoFactorContainer />
          </div>
        </div>
      );
}
export default TwoFactorAuthPage;