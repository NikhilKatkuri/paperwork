"use client";
import React, { useState } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id?: string;
    name?: string;
    note?: string;
}

export default function PasswordInput({
    label,
    note,
    id,
    name,
    ...props
}: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    return (
        <div className="grid w-full grid-cols-1 gap-3">
            <label
                htmlFor={id}
                className="border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-brand-depth/50 rounded-xl border p-3 transition-all duration-200 ease-in-out focus-within:ring-2"
            >
                <div className="flex items-center justify-between">
                    <span className="text-theme-on-surface/60 text-xs">
                    {label}
                </span>
                <button
                    type="button"
                    className="text-theme-on-surface/60 hover:text-theme-on-surface focus:outline-none"
                    onClick={() => setIsVisible(!isVisible)}
                >
                    {isVisible ? 'Hide' : 'Show'}
                </button>
                </div>
                <input
                    {...props}
                    type={isVisible ? "text" : "password"}
                    id={id}
                    name={name}
                    autoComplete={id}
                    className="text-theme-on-surface w-full border-none bg-transparent py-1.5 text-base font-medium focus:outline-none"
                    placeholder="Enter a strong new password"
                />
            </label>
            {note ? (
                <p className="text-theme-on-surface/60 text-xs">{note}</p>
            ) : null}
        </div>
    );
}
