'use client';

import { useRef } from 'react';

interface OTPInputProps {
    otpValues: string[];
    setOtpValues: React.Dispatch<React.SetStateAction<string[]>>;
}

function OTPInput({ otpValues, setOtpValues }: OTPInputProps) {
    const length = 6;
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        if (!sanitizedValue) {
            const newOtpValues = [...otpValues];
            newOtpValues[index] = '';
            setOtpValues(newOtpValues);
            return;
        }

        const digit = sanitizedValue.slice(-1);
        const newOtpValues = [...otpValues];
        newOtpValues[index] = digit;
        setOtpValues(newOtpValues);

        if (index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === 'Backspace') {
            if (otpValues[index]) {
                return;
            }
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtpValues = [...otpValues];
                newOtpValues[index - 1] = '';
                setOtpValues(newOtpValues);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (
        index: number,
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData('text')
            .replace(/[^0-9]/g, '');

        if (!pastedData) return;

        const newOtpValues = [...otpValues];
        // Distribute pasted characters across remaining slots starting at target index
        for (let i = 0; i < pastedData.length && index + i < length; i++) {
            newOtpValues[index + i] = pastedData[i];
        }

        setOtpValues(newOtpValues);

        // Focus the input immediately following the last filled slot
        const nextIndex = Math.min(index + pastedData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="flex items-center justify-center gap-4">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpValues[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(index, e)}
                    className="aspect-square h-12 w-12 rounded-md border border-gray-300 p-3 text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            ))}
        </div>
    );
}

export default OTPInput;
