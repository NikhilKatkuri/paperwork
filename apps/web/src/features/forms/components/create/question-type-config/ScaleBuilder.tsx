'use client';
import React, { useState } from 'react';

export interface ScaleConfig {
    lowerBound: number;
    upperBound: number;
    lowerLabel: string;
    upperLabel: string;
}

interface ScaleBuilderProps {
    config?: ScaleConfig;
    id: number;
    onChange?: (config: ScaleConfig) => void;
}

export default function ScaleBuilder({
    config = { lowerBound: 1, upperBound: 5, lowerLabel: '', upperLabel: '' },
    onChange,
}: ScaleBuilderProps) {
    const [scale, setScale] = useState<ScaleConfig>(config);

    const updateScale = (key: keyof ScaleConfig, value: string | number) => {
        const newScale = { ...scale, [key]: value };
        setScale(newScale);
        onChange?.(newScale);
    };

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex items-center gap-3">
                <select
                    value={scale.lowerBound}
                    onChange={(e) =>
                        updateScale('lowerBound', parseInt(e.target.value, 10))
                    }
                    className="text-theme-form-on-surface cursor-pointer border-b border-dotted bg-transparent p-1 font-semibold outline-none"
                >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                </select>
                <p className="text-theme-form-on-surface/80">to</p>
                <select
                    value={scale.upperBound}
                    onChange={(e) =>
                        updateScale('upperBound', parseInt(e.target.value, 10))
                    }
                    className="text-theme-form-on-surface cursor-pointer border-b border-dotted bg-transparent p-1 font-semibold outline-none"
                >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                    ))}
                </select>
            </div>

            <div className="text-theme-form-on-surface/60 grid max-w-sm grid-cols-1 gap-2 p-2">
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">
                        {scale.lowerBound}
                    </p>
                    <input
                        type="text"
                        value={scale.lowerLabel}
                        onChange={(e) =>
                            updateScale('lowerLabel', e.target.value)
                        }
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">
                        {scale.upperBound}
                    </p>
                    <input
                        type="text"
                        value={scale.upperLabel}
                        onChange={(e) =>
                            updateScale('upperLabel', e.target.value)
                        }
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
            </div>
        </div>
    );
}
