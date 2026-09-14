"use client";
import { cn } from "@/utils/cn";
import { useLayoutEffect, useRef } from "react";

function PlainTextInput({
    value,
    onChange,
    placeholder,
}: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={onChange && ((e) => onChange(e.target.value))}
            placeholder={placeholder}
            rows={1}
            className={cn(
                'w-full resize-none overflow-hidden border-none bg-transparent p-0',
                'text-2xl leading-tight font-semibold tracking-tight',
                'text-theme-form-text placeholder:text-theme-form-text/40',
                'focus:ring-0 focus:outline-none'
            )}
        />
    );
}
export default PlainTextInput;