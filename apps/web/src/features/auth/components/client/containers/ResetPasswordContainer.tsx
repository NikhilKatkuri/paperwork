'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import jwtDecode from '@/utils/jwtDecode';
import ResetPasswordComponent from '../ResetPasswordComponent';
import Image from 'next/image';
import { toast } from 'sonner';

interface Decode {
    email: string;
    token: string;
    exp: number;
    iat: number;
}

type ViewMode = 'resetPassword' | 'success' | 'error';

const TOAST_OPTIONS = {
    duration: 3000,
    position: 'top-center',
} as const;

export default function ResetPasswordContainer() {
    const params = useParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const token = params?.token as string | undefined;

    const { decodedToken, isExpired } = jwtDecode<Decode>(token || '');
    const isTokenValid = token && decodedToken && !isExpired;

    const [viewMode, setViewMode] = useState<ViewMode>(
        isTokenValid ? 'resetPassword' : 'error'
    );

    const handleSuccessRedirect = () => {
        const toastId = toast.loading(
            'Processing password reset...',
            TOAST_OPTIONS
        );

        setTimeout(() => {
            toast.dismiss(toastId);
            toast.success(
                'Password reset successful! Redirecting to sign in...',
                TOAST_OPTIONS
            );
            startTransition(() => {
                router.push('/auth/signin?step=1');
            });
        }, 2000);
    };

    const handleErrorRedirect = () => {
        const toastId = toast.loading(
            'Processing password reset...',
            TOAST_OPTIONS
        );

        setTimeout(() => {
            toast.dismiss(toastId);
            toast.error(
                'An error occurred during password reset. Please try again.',
                TOAST_OPTIONS
            );
            startTransition(() => {
                router.push('/auth/forgot-password');
            });
        }, 2000);
    };

    switch (viewMode) {
        case 'success':
            return (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center selection:bg-green-100/50">
                    <div className="relative mb-6 h-64 w-64 lg:h-80 lg:w-80">
                        <Image
                            src="/illustration/Auth_Success.svg"
                            alt="success"
                            fill
                            className="object-contain select-none"
                            priority
                        />
                    </div>
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-gray-900">
                            Password Reset Successful
                        </h2>
                        <p className="mt-1 text-gray-600">
                            Your password has been updated securely.
                        </p>
                    </div>
                    <button
                        onClick={handleSuccessRedirect}
                        disabled={isPending}
                        className="text-on-brand-depth bg-brand-depth/95 hover:bg-brand-depth scale-100 cursor-pointer rounded-full px-12 py-3 transition-all duration-200 ease-in-out select-none active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? 'Redirecting...' : 'Go to Sign In'}
                    </button>
                </div>
            );

        case 'error':
            return (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center selection:bg-red-100/30">
                    <div className="relative mb-6 h-64 w-64 lg:h-80 lg:w-80">
                        <Image
                            src="/illustration/Time_change.svg"
                            alt="expired"
                            fill
                            className="object-contain select-none"
                            priority
                        />
                    </div>
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-gray-900">
                            Link Expired or Invalid
                        </h2>
                        <p className="mt-1 text-gray-600">
                            This password reset link is no longer valid.
                        </p>
                    </div>
                    <button
                        onClick={handleErrorRedirect}
                        disabled={isPending}
                        className="text-on-brand-depth bg-brand-depth/95 hover:bg-brand-depth scale-100 cursor-pointer rounded-full px-12 py-3 transition-all duration-200 ease-in-out select-none active:scale-95 disabled:opacity-50"
                    >
                        Request a new password reset link
                    </button>
                </div>
            );

        case 'resetPassword':
        default:
            return (
                <ResetPasswordComponent
                    token={token!}
                    email={decodedToken!.email}
                    onSuccess={() => setViewMode('success')}
                    onError={() => setViewMode('error')}
                />
            );
    }
}
