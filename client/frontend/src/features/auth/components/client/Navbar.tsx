'use client';

import { SolarAltArrowLeftBroken } from '@/icons/index';
import { useRouter, useSearchParams } from 'next/navigation';

const Navbar = () => {
    const router = useRouter();
    const search = useSearchParams();

    const step = search.get('step')
        ? parseInt(search.get('step') as string)
        : 1;
    const hasBack = step > 1;

    return (
        <div className="flex w-full items-center justify-between">
            {hasBack ? (
                <button
                    onClick={() => router.back()}
                    type="button"
                    className="text-theme-on-surface/70 hover:bg-theme-surface-hover active:bg-theme-surface-hover hover:text-theme-on-surface scale-100 cursor-pointer rounded-full p-3 text-sm font-medium transition-all duration-150 ease-in-out active:scale-95"
                >
                    <SolarAltArrowLeftBroken className="size-5" />
                </button>
            ) : (
                <div className="h-11 w-11" />
            )}

            <div className="h-11 w-11" />
        </div>
    );
};

export default Navbar;
