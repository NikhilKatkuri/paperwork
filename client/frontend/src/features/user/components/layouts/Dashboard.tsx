import { cn } from "@/utils/cn";
import { LayoutConfig } from "../constants/config";
import { SolarAltArrowLeftBroken } from "@/icons/index";
import Sidebar from "../sidebar";

function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <header className="h-16 w-full border-b bg-theme-surface border-theme-on-surface/70 flex items-center justify-between px-3  md:hidden">
        <button className="h-10 aspect-square flex items-center justify-center rounded-full transition-all ease-in-out duration-200 hover:bg-theme-on-surface active:bg-brand-light">
          <SolarAltArrowLeftBroken />
        </button>

        <div className="h-11 w-11"></div>
        <div className="h-11 w-11"></div>
      </header>
     <Sidebar/>
      {children}
    </div>
  );
}

export default Dashboard;
