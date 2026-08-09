'use client';

import { useAuth } from '@/providers';
import {
    validateEmail,
    validatePassword,
    validateString,
} from '@/utils/validations';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const ToastOptions = {
    duration: 4000,
    position: 'top-center',
} as const;

const SignUpClientComponent = () => {
    const initialEmail = useSearchParams().get('email');
    const { signUp, setAccessToken } = useAuth();
    const { loading, handleSignUp } = signUp;

    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
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
        const fullNameError = validateString(fullName, 'fullName');
        if (fullNameError) {
            newErrors.fullName = fullNameError;
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
            newErrors.password = passwordError;
        }

        setFieldErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const res = await handleSignUp({ email, password, fullName });

        if (res.ok) {
            toast.success('Account created successfully!', ToastOptions);
            setAccessToken(res.data.accessToken);
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
            <div>
                <div className="border-theme-on-surface/20 w-full rounded-full border p-3 px-4 outline-0">
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full outline-0"
                        placeholder="Full Name"
                    />
                </div>
                {fieldErrors.fullName && (
                    <p className="mt-2 px-3 text-xs text-red-500">
                        {fieldErrors.fullName}
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
                {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
        </form>
    );
};

export default SignUpClientComponent;
