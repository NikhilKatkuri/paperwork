import Image from "next/image";

function UserHeader() {
  return (
    <header className="w-full py-4 flex items-center justify-between gap-4">
      <div className="flex gap-2 items-center">
        <Image
          src="/paperwork_icon-vector-master.svg"
          alt="Paperwork Icon"
          height={32}
          width={32}
        />
        <p className="font-medium text-lg w-36 text-left max-[44rem]:hidden">Paper Work</p>
      </div>
      <div className="w-full">
        <label
          htmlFor="search-input"
          className="group flex h-14 w-full cursor-text items-center overflow-hidden rounded-full bg-slate-100 px-4 focus-within:shadow-sm transition-all  focus-within:ring-brand-light"
        >
          <div className="flex items-center justify-center text-slate-500 group-focus-within:text-brand-light">
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
