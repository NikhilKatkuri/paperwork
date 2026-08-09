import Image from 'next/image';

function UserHeader() {
    return (
        <header className="bg-theme-surface sticky top-0 z-50 flex w-full items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2">
                <Image
                    src="/paperwork_icon-vector-master.svg"
                    alt="Paperwork Icon"
                    height={32}
                    width={32}
                    className="h-6 w-6 min-[44rem]:h-8 min-[44rem]:w-8"
                />
                <p className="w-36 text-left text-lg font-medium max-[44rem]:hidden">
                    Paper Work
                </p>
            </div>
            <div className="w-full">
                <label
                    htmlFor="search-input"
                    className="group focus-within:ring-brand-light flex h-10 w-full cursor-text items-center overflow-hidden rounded-full bg-slate-100 px-4 transition-all focus-within:shadow-sm min-[44rem]:h-14"
                >
                    <div className="group-focus-within:text-brand-light flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-theme-on-surface select-none">
                            search
                        </span>
                    </div>
                    <input
                        id="search-input"
                        name="search-input"
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-transparent px-3 text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                </label>
            </div>
        </header>
    );
}

export default UserHeader;
