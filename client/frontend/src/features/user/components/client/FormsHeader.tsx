import { cn } from '@/utils/cn';

function ViewFormsHeader({
    viewAsRow,
    setViewAsRow,
    sort,
}: Readonly<{
    viewAsRow: boolean;
    setViewAsRow: () => void;
    sort: () => void;
}>) {
    return (
        <div
            className={cn(
                'bg-theme-surface sticky top-16 z-50 grid w-full grid-cols-[1fr_0.5fr] items-center py-2 *:text-sm md:top-22 transition-all ease-in-out duration-300',
                viewAsRow ? 'px-4' : 'px-0'
            )}
        >
            <div className="">
                <p className="font-medium">Recent forms</p>
            </div>
            <div
                className={cn(
                    'grid items-center justify-end gap-4 max-md:grid-cols-[1fr_36px]',
                    viewAsRow
                        ? 'grid-cols-[1fr_36px] min-[900px]:grid-cols-[1fr_36px] xl:grid-cols-[1fr_160px]'
                        : 'grid-cols-[1fr]'
                )}
            >
                {viewAsRow ? (
                    <div className="max-[900px]:hidden">
                        <p className="">Last opened by me</p>
                    </div>
                ) : null}
                <button className="hover:bg-brand-light/60 flex aspect-square h-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out xl:hidden">
                    <span className="material-symbols-outlined">apps</span>
                </button>
                <div className="hidden items-center justify-end gap-4 xl:flex">
                    <button
                        onClick={setViewAsRow}
                        className="hover:bg-brand-light/60 flex aspect-square h-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
                    >
                        <span className="material-symbols-outlined">
                            {viewAsRow ? 'view_list' : 'calendar_view_month'}
                        </span>
                    </button>
                    <button
                        onClick={sort}
                        className="hover:bg-brand-light/60 flex aspect-square h-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out"
                    >
                        <span className="material-symbols-outlined">
                            sort_by_alpha
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ViewFormsHeader;
