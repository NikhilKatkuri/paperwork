import { cn } from "@/utils/cn";
import { LayoutConfig, LayoutContent } from "../constants/config";
import { SolarAltArrowLeftBroken } from "@/icons/index";

function Dashboard() {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <header className="h-16 w-full border-b bg-theme-surface border-theme-on-surface/70 flex items-center justify-between px-3  md:hidden">
        <button className="h-10 aspect-square flex items-center justify-center rounded-full transition-all ease-in-out duration-200 hover:bg-theme-on-surface active:bg-brand-light">
          <SolarAltArrowLeftBroken />
        </button>

        <div className="h-11 w-11"></div>
        <div className="h-11 w-11"></div>
      </header>
      <aside className="max-md:hidden h-full w-full border-r bg-theme-surface border-theme-on-surface/10 p-4">
        {LayoutContent.map((item) => {
          return (
            <button
              key={item}
              className="h-12 bg-transparent w-full text-theme-on-surface transition-all ease-in-out duration-200 hover:bg-brand-light rounded-md px-3 cursor-pointer text-left"
            >
              {item}
            </button>
          );
        })}
      </aside>
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome to your dashboard!</p>
      </div>
    </div>
  );
}

export default Dashboard;
