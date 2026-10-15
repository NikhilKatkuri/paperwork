'use client';

import { useAuth } from '@/providers';
import { validateEmail, validatePassword } from '@/utils/validations';
import { redirect, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const ToastOptions = {
    duration: 2000,
    position: 'top-center',
} as const;

const SignInClientComponent = () => {
    const initialEmail = useSearchParams().get('email');
    const { signIn, setAccessToken } = useAuth();
    const { loading, handleSignIn } = signIn;

    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const inUse = useRef(false);

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
        inUse.current = true;
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        const emailError = validateEmail(email);
        if (emailError) {
            newErrors.email = emailError;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            newErrors.password = passwordError;
        }

        setFieldErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const res = await handleSignIn({ email, password });

        if (res.ok) {
            if (res.data?.twoFactorRequired) {
                toast.info(
                    'Two-factor authentication is required. Please check your email for the verification code.',
                    { ...ToastOptions, duration: 1200 }
                );
                setTimeout(() => {
                    toast.loading(
                        'Redirecting to 2FA verification page...',
                        ToastOptions
                    );
                }, 1200);

                setTimeout(() => {
                    toast.dismiss();
                    redirect('/auth/signin/2fa');
                }, 2000);
            } else {
                toast.success('Signed in successfully!', ToastOptions);
                setAccessToken(res.data.accessToken);
                toast.loading('Redirecting...', {
                    ...ToastOptions,
                    duration: 1000,
                });
                setTimeout(() => {
                    toast.dismiss();
                    redirect('/user');
                }, 1500);
            }
        } else {
            toast.error(res.error, ToastOptions);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="my-3 grid w-full grid-cols-1 space-y-4 transition-all duration-150 ease-in-out md:space-y-6"
        >
            <div>
                <div className="border-theme-on-surface/20 w-full rounded-full border p-3 px-4 outline-0">
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full outline-0"
                        placeholder="Email"
                    />
                </div>
                {fieldErrors.email && (
                    <p className="mt-2 px-3 text-xs text-red-500">
                        {fieldErrors.email}
                    </p>
                )}
            </div>
            <div className="">
                <div className="border-theme-on-surface/20 w-full rounded-full border p-3 px-4 outline-0">
                    <input
                        type="password"
                        className="w-full outline-0"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {fieldErrors.password && (
                    <p className="mt-2 px-3 text-xs text-red-500">
                        {fieldErrors.password}
                    </p>
                )}
            </div>
            <button
                type="submit"
                className="bg-brand-depth/95 hover:bg-brand-depth text-on-brand-depth w-full scale-100 cursor-pointer rounded-full p-3 px-4 transition-all duration-200 ease-in-out active:scale-[0.97]"
            >
                {loading ? 'Signing In...' : 'Sign In'}
            </button>
        </form>
    );
};

export default SignInClientComponent;
