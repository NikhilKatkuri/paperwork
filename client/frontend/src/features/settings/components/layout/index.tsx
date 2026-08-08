import Sidebar from "../client/Sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      <nav className="md:hidden h-16 w-full border-b border-theme-skeletion-surface px-4 flex items-center justify-center">
        <p className="text-center">Settings</p>
      </nav>
      <div className="flex flex-1 items-center justify-center p-4 h-full">
        <div className="flex  p-2 border border-theme-skeletion-surface rounded-2xl gap-4 h-96  max-w-4xl w-full ">
          <Sidebar />
          <div className="p-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
