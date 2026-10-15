import { cn } from '@/utils/cn';
import Image from 'next/image';
import LayoutConfig from '../ui/config';
import Navbar from '../client/Navbar';
import ChangePasswordComponent from '../client/ChangePasswordComponent';

function ChangePasswordPage() {
    return (
        <div className={cn(LayoutConfig.layout)}>
            <section className={cn(LayoutConfig.leftSection)}></section>
            <section className={cn(LayoutConfig.rightSection)}>
                <Navbar />
                <div className="flex h-full w-full flex-col items-center justify-center space-y-5">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/paperwork_icon-vector-master.svg"
                                alt="paperwork-icon-vector-master"
                                width={32}
                                height={32}
                                className=""
                            />
                            <p className="my-3 text-lg font-medium">
                                Paper Work
                            </p>
                        </div>
                        <h1 className="text-xl font-semibold md:text-2xl md:font-medium">
                            Update your password
                        </h1>
                        <p className="text-md md:text-lg">
                            Enter your new password below to update your account
                            credentials.
                        </p>
                    </div>
                    <ChangePasswordComponent />
                </div>
            </section>
        </div>
    );
}

export default ChangePasswordPage;
