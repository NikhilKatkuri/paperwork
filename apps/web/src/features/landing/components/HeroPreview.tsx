import Image from 'next/image';

export function HeroPreview() {
    return (
        <div className="relative w-full">
            {/* Soft ambient glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-10 -bottom-6 -z-10 rounded-[3rem] bg-black/10 blur-3xl sm:inset-x-12 dark:bg-white/6"
            />

            {/* Browser window: edge-to-edge on mobile, rounded card from sm up */}
            <div className="border-theme-on-surface/10 bg-theme-surface overflow-hidden border-y shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] sm:rounded-2xl sm:border lg:rounded-3xl">
                {/* Title bar */}
                <div className="border-theme-on-surface/10 bg-theme-surface relative flex h-9 items-center border-b px-3 sm:h-11 sm:px-4 lg:h-12">
                    <div
                        className="flex items-center gap-1.5 sm:gap-2"
                        aria-hidden
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] ring-1 ring-black/10 ring-inset sm:h-3 sm:w-3" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] ring-1 ring-black/10 ring-inset sm:h-3 sm:w-3" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] ring-1 ring-black/10 ring-inset sm:h-3 sm:w-3" />
                    </div>

                    <div className="bg-theme-on-surface/5 text-theme-on-surface/60 absolute left-1/2 -translate-x-1/2 rounded-md px-3 py-1 text-[10px] font-medium tracking-tight sm:text-xs">
                        paperwork.app
                    </div>
                </div>

                {/* App screenshot */}
                <Image
                    src="/hero-preview.png"
                    alt="Paperwork app home screen showing form templates and recent forms"
                    width={1918}
                    height={953}
                    priority
                    sizes="(min-width: 1280px) 1200px, 100vw"
                    className="block h-auto w-full select-none"
                />
            </div>
        </div>
    );
}
