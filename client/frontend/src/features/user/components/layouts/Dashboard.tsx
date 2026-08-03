import { cn } from "@/utils/cn";
import { LayoutConfig, LayoutContent } from "../../constants/config";
import { SolarAltArrowLeftBroken } from "@/icons/index";
import EditProfilePage from "../pages/EditProfilePage";
import Link from "next/link";

function render(mode: "edit-profile" | "account-management" | null) {
  switch (mode) {
    case "edit-profile":
      return <EditProfilePage />;
    case "account-management":
      return <div>Account Management Page</div>;
    default:
      return null;
  }
}

type DashboardProps = {
  mode?: "edit-profile" | "account-management";
};
function Dashboard({ mode }: DashboardProps) {
  return (
    <div className={cn(LayoutConfig.layout)}>
      <header className="h-16 w-full border-b bg-theme-surface border-theme-grey-lg flex items-center justify-between px-3 lg:hidden shrink-0">
        <button className="h-10 aspect-square flex items-center justify-center rounded-full transition-all ease-in-out duration-200 hover:bg-theme-surface-hover active:bg-theme-surface-hover">
          <SolarAltArrowLeftBroken />
        </button>
        <div className="h-11 w-11" />
        <div className="h-11 w-11" />
      </header>

      <aside className="hidden lg:flex lg:flex-col max-w-sm w-full h-full border-r border-theme-grey-lg p-4 shrink-0">
        {LayoutContent.map((item) => (
          <Link
            href={item.route}
            key={item.value}
            className="h-12 w-full flex items-center text-theme-on-surface transition-all ease-in-out duration-200 hover:bg-theme-grey-sm rounded-md px-3 cursor-pointer text-left"
          >
            {item.name}
          </Link>
        ))}
      </aside>

      <main className="flex-1 overflow-auto">{render(mode ?? null)}</main>
    </div>
  );
}

export default Dashboard;
