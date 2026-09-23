'use client';
 
import { FormDB } from '@/lib/db';
import { cn } from '@/utils/cn';
import Link from 'next/link';

function toDateString(date: number): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function FormsView({
    viewAsRow,
    form,
}: Readonly<{
    viewAsRow: boolean;
    form?: FormDB;
}>) {
    if(!form) return null;
    if (viewAsRow) {
        return (
            <Link
                href={'/forms/c/' + (form ? form._id : '')}
                className={cn(
                    'hover:bg-brand-light grid h-14 w-full cursor-pointer grid-cols-[1fr_0.5fr] items-center rounded-md border border-transparent px-4 transition-all duration-150 ease-in-out *:text-sm md:grid-cols-2'
                )}
            >
                <div className="grid grid-cols-[36px_1fr] items-center gap-4">
                    <div className="bg-brand-depth flex aspect-square h-7 w-7 items-center justify-center rounded-md">
                        <div className="material-symbols-outlined text-on-brand-depth">
                            format_list_bulleted
                        </div>
                    </div>
                    <p className="font-medium">
                        {form.name ? form.name : 'Untitled Form'}
                    </p>
                </div>
                <div
                    className={cn(
                        'grid items-center gap-4 max-[900px]:grid-cols-[1fr_36px] xl:justify-end',
                        'grid-cols-[1fr_32px] min-[900px]:grid-cols-[1fr_1fr_36px] xl:grid-cols-[1fr_1fr_160px]'
                    )}
                >
                    <div className="text-left">
                        <p className="text-md">me</p>
                    </div>
                    <div className="max-[900px]:hidden">
                        <p className="text-md"> {form ? toDateString(form.updatedAt) : '9 AM'}</p>
                    </div>

                    <div className="flex items-center justify-end">
                        <button className="hover:bg-brand-light/60 flex aspect-square h-10 items-center justify-center rounded-full transition-all duration-150 ease-in-out">
                            <span className="material-symbols-outlined">
                                more_vert
                            </span>
                        </button>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={'/'}
            className={
                'grid-row-[1fr_36px] hover:bg-brand-light border-theme-skeletion-surface grid w-full cursor-pointer items-center gap-2 rounded-md border p-4 transition-all duration-150 ease-in-out *:text-sm'
            }
        >
            <div className="flex h-auto w-full flex-col gap-2">
                <div className="grid h-8 grid-cols-[36px_1fr_20px] items-center gap-1">
                    <div className="bg-brand-depth flex aspect-square h-7 w-7 items-center justify-center rounded-md">
                        <div className="material-symbols-outlined text-on-brand-depth">
                            format_list_bulleted
                        </div>
                    </div>
                    <p className="font-medium">Recent forms</p>
                    <button className="rounded-full">
                        <span className="material-symbols-outlined">
                            more_vert
                        </span>
                    </button>
                </div>
                <div className="h-32 w-full rounded-md bg-gray-100"></div>
            </div>
            <div className={cn('grid items-center')}>
                <div className="">
                    <p className="text-md">me</p>
                </div>

                <div className="">
                    <p className="text-sm">9:00 AM</p>
                </div>
            </div>
        </Link>
    );
}

export default FormsView;
