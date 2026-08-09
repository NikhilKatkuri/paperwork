export default function PasswordPage() {
    return (
        <div className="h-full w-full scrollbar-none overflow-y-auto rounded-xl">
            <form className="flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-theme-on-surface text-lg font-bold md:text-xl">
                            Password Settings
                        </h1>
                        <p className="text-theme-on-surface/80 md:text-md text-sm">
                            Maintain the security of your account by changing
                            your password regularly. You can also enable
                            two-factor authentication for an extra layer of
                            protection.
                        </p>
                    </div>

                    {/* Password Change Section */}
                    <div className="mt-2 grid max-w-xl grid-cols-1 gap-6">
                        {/* Current Password */}
                        <div className="grid w-full grid-cols-1 gap-3">
                            <p className="text-md text-theme-on-surface font-semibold md:text-lg">
                                Current Password
                            </p>
                            <label
                                htmlFor="current-password"
                                className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
                            >
                                <span className="text-theme-on-surface/60 text-xs">
                                    Current Password
                                </span>
                                <input
                                    type="password"
                                    id="current-password"
                                    name="currentPassword"
                                    autoComplete="current-password"
                                    className="text-theme-on-surface w-full border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                                    placeholder="Enter your current password"
                                />
                            </label>
                        </div>

                        {/* New Password */}
                        <div className="grid w-full grid-cols-1 gap-3">
                            <p className="text-md text-theme-on-surface font-semibold md:text-lg">
                                New Password
                            </p>
                            <label
                                htmlFor="new-password"
                                className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
                            >
                                <span className="text-theme-on-surface/60 text-xs">
                                    New Password
                                </span>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="newPassword"
                                    autoComplete="new-password"
                                    className="text-theme-on-surface w-full border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                                    placeholder="Enter a strong new password"
                                />
                            </label>
                            <p className="text-theme-on-surface/60 text-xs">
                                Must be at least 8 characters and include a mix
                                of letters, numbers, and symbols.
                            </p>
                        </div>

                        {/* Confirm New Password */}
                        <div className="grid w-full grid-cols-1 gap-3">
                            <p className="text-md text-theme-on-surface font-semibold md:text-lg">
                                Confirm New Password
                            </p>
                            <label
                                htmlFor="confirm-password"
                                className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
                            >
                                <span className="text-theme-on-surface/60 text-xs">
                                    Confirm New Password
                                </span>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    className="text-theme-on-surface w-full border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                                    placeholder="Re-enter your new password"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
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
