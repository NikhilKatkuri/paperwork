'use client';

import Image from 'next/image';
import Link from 'next/link';
import OTPInput from '../../ui/otp';
import { useAuth } from '@/providers';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ToastOptions = {
    duration: 2000,
    position: 'top-center',
} as const;

function TwoFactorComponent() {
    const router = useRouter();
    const { twoFactorAuth, setAccessToken } = useAuth();
    const { loading, handler } = twoFactorAuth;
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (otpValues.some((value) => value === '')) {
            toast.error('Please fill in all OTP fields.', ToastOptions);
            return;
        }
        const res = await handler(otpValues.join(''));
        if (res.ok && res.data?.accessToken) {
            toast.success('Signed in successfully!', {
                ...ToastOptions,
                duration: 1000,
            });
            setAccessToken(res.data.accessToken);
            setTimeout(() => {
                toast.loading('Redirecting...', ToastOptions);
            }, 500);
            setTimeout(() => {
                router.push('/user');
            }, 3000);
        }
    };

    return (
        <form
            className="flex h-full w-full flex-col items-center justify-center space-y-5"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Image
                        src="/paperwork_icon-vector-master.svg"
                        alt="paperwork-icon-vector-master"
                        width={32}
                        height={32}
                        className=""
                    />
                    <p className="my-3 text-lg font-medium">Paper Work</p>
                </div>
                <h1 className="text-xl font-semibold md:text-2xl md:font-medium">
                    Let&apos;s get verified!
                </h1>
                <p className="text-md md:text-lg">
                    To ensure the security of your account, we request you to
                    enter the OTP sent to your registered email address.
                </p>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-6">
                <OTPInput otpValues={otpValues} setOtpValues={setOtpValues} />
                <button
                    type="submit"
                    className="bg-brand-depth/95 hover:bg-brand-depth text-on-brand-depth w-full scale-100 cursor-pointer rounded-full p-3 px-4 transition-all duration-200 ease-in-out active:scale-[0.97]"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </div>
            <footer className="my-3 grid w-full grid-cols-1 space-y-3">
                <div className="flex w-full items-center justify-center gap-3 text-center text-xs">
                    <Link
                        href={''}
                        className="hover:underline active:underline"
                    >
                        Terms of Use
                    </Link>
                    <Link
                        href={''}
                        className="hover:underline active:underline"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </form>
    );
}
export default TwoFactorComponent;
