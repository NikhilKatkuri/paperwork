
export default function SecurityPage() {
    return (
        <div className="h-full w-full scrollbar-none overflow-y-auto rounded-xl">
            <form className="flex flex-col justify-between gap-6 flex-1">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-theme-on-surface text-lg font-bold md:text-xl">
                            Security
                        </h1>
                        <p className="text-theme-on-surface/80 md:text-md text-sm">
                            Make changes to your personal information or account
                            type.
                        </p>
                    </div>

                    <div className="mt-2 grid max-w-xl grid-cols-1 gap-6">
                        <div className="grid w-full grid-cols-1 gap-3">
                            <div className="">
                                <h2 className="text-md font-semibold md:text-lg">
                                    Two-factor authentication
                                </h2>
                                <p className="mt-2">
                                    This makes your account extra secure. Along
                                    with your password, you&apos;ll need to
                                    enter the secret code we text to your phone
                                    each time you log in.
                                </p>
                            </div>
                            <div className="grid grid-cols-[20px_1fr] gap-4">
                                <input
                                    type="checkbox"
                                    className="size-6 rounded-xl"
                                />
                                <p className="">Require code at login</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex w-full items-center justify-end gap-4 pt-6">
                    <button
                        type="button"
                        className="bg-theme-form-on-surface/10 hover:bg-theme-form-on-surface/90 text-theme-on-surface cursor-pointer rounded-full p-4 px-7 sm:px-8 text-sm font-semibold transition-all duration-200 ease-in-out hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit" 
                        className="bg-brand-depth text-on-brand-depth hover:bg-brand-depth/90 cursor-pointer rounded-full p-4 px-7 sm:px-8 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                        {false ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
