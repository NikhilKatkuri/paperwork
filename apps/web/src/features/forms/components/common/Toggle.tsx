'use client';

import React, { useState } from 'react';

interface ToggleProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
}

function Toggle({ checked, defaultChecked = false, onChange, disabled = false, label }: ToggleProps) {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);

    // Support both controlled and uncontrolled usage
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const handleClick = () => {
        if (disabled) return;
        const next = !isChecked;
        if (!isControlled) setInternalChecked(next);
        onChange?.(next);
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-label={label}
            disabled={disabled}
            onClick={handleClick}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                isChecked ? 'bg-theme-form-container-active' : 'bg-theme-form-container-border'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                    isChecked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

export default Toggle;