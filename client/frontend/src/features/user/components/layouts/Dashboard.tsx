import { cn } from "@/utils/cn";
import { LayoutConfig } from "../constants/config";
import { SolarAltArrowLeftBroken } from "@/icons/index";
import Sidebar from "../sidebar";

function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <header className="h-16 w-full border-b bg-theme-surface border-theme-grey-lg flex items-center justify-between px-3 lg:hidden shrink-0">
        <button className="h-10 aspect-square flex items-center justify-center rounded-full transition-all ease-in-out duration-200 hover:bg-theme-surface-hover active:bg-theme-surface-hover">
          <SolarAltArrowLeftBroken />
        </button>
        <div className="h-11 w-11" />
        <div className="h-11 w-11" />
      </header>
     <Sidebar/>
      {children}
    </div>
  );
}

export default Dashboard;
