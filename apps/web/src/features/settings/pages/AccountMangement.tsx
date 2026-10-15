import AccountActionComponent from '../components/client/AccountActionComponent';
import PresonalInfoComponent from '../components/client/PresonalInfoComponent';

export default function AccountManagement() {
    return (
        <div className="h-full w-full scrollbar-none overflow-y-auto rounded-xl px-2">
            <div className="flex flex-col justify-between gap-6">
                <div>
                    <h1 className="text-theme-on-surface text-lg font-bold md:text-xl">
                        Account Management
                    </h1>
                    <p className="text-theme-on-surface/80 md:text-md text-sm">
                        Include additional security such as turning on
                        two-factor authentication and checking your list of
                        connected devices to keep your account,
                    </p>
                </div>
                <PresonalInfoComponent />
                <AccountActionComponent />
            </div>
        </div>
    );
}
