 
import { cn } from "@/utils/cn";
 
function ViewFormsHeader({viewAsRow, setViewAsRow}:{viewAsRow: boolean, setViewAsRow: () => void}) { 
  return (
    <div className="w-full *:text-sm z-50 px-4 py-2  grid-cols-[1fr_0.5fr] grid md:grid-cols-2 items-center sticky top-22 bg-theme-surface">
      <div className="">
        <p className="font-medium">Recent forms</p>
      </div>
      <div
        className={cn(
          "grid gap-4 items-center justify-end max-md:grid-cols-[1fr_36px]",
          viewAsRow ? "grid-cols-[1fr_36px] min-[900px]:grid-cols-[1fr_1fr_36px] xl:grid-cols-[1fr_1fr_160px]" : "grid-cols-[1fr_160px] gap-12",
        )}
      >
        <div className={cn( viewAsRow ? "" :"text-right",)}>
          <p className="">Owned by me</p>
        </div>
        {viewAsRow ? (
          <div className="max-[900px]:hidden">
            <p className="">Last opened by me</p>
          </div>
        ) : null}
        <button className="xl:hidden rounded-full transition-all ease-in-out duration-150 hover:bg-brand-light/60 flex items-center justify-center h-10  aspect-square">
          <span className="material-symbols-outlined">apps</span>
        </button>
        <div className="xl:flex hidden items-center gap-4 justify-end">
          <button
            onClick={setViewAsRow}
            className="rounded-full transition-all ease-in-out duration-150 hover:bg-brand-light/60 flex items-center justify-center h-10  aspect-square"
          >
            <span className="material-symbols-outlined">
              {viewAsRow ? "view_list" : "calendar_view_month"}
            </span>
          </button>
          <button className="rounded-full transition-all ease-in-out duration-150 hover:bg-brand-light/60 flex items-center justify-center h-10  aspect-square">
            <span className="material-symbols-outlined">sort_by_alpha</span>
          </button>
          <button className="rounded-full transition-all ease-in-out duration-150 hover:bg-brand-light/60 flex items-center justify-center h-10  aspect-square">
            <span className="material-symbols-outlined">folder</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewFormsHeader;
