'use client';
import React, { useState } from 'react';

type rate_icons = 'kid_star' | 'favorite' | 'thumb_up';

export interface RateConfig {
    maxRating: number;
    symbol: rate_icons;
}

interface RateBuilderProps {
    config?: RateConfig;
    onChange?: (config: RateConfig) => void;
}

export default function RatingBuilder({
    config = { maxRating: 5, symbol: 'kid_star' },
    onChange,
}: RateBuilderProps) {
    const [Rate, setRate] = useState<RateConfig>(config);

    const [openSymbolDialog, setOpenSymbolDialog] = useState(false);
    const [openScaleDialog, setOpenScaleDialog] = useState(false);

    const updateRate = (key: keyof RateConfig, value: string | number) => {
        const newRate = { ...Rate, [key]: value };
        setRate(newRate);
        onChange?.(newRate);
    };

    return (
        <div className="flex flex-col gap-4 py-3 md:p-3">
            <div className="flex items-center gap-3">
                <div className="border-theme-form-container-border/80 relative flex h-12 w-20 items-center justify-center rounded-md border">
                    <button
                        onClick={() => setOpenScaleDialog(!openScaleDialog)}
                        className="flex h-full w-full items-center justify-center"
                    >
                        <div className="text-theme-form-on-container">
                            {Rate.maxRating}
                        </div>
                        <div className="material-symbols-outlined text-theme-form-on-container justify-self-end text-[20px]">
                            arrow_drop_down
                        </div>
                    </button>
                    {openScaleDialog && (
                        <div className="bg-theme-form-container absolute top-full left-1/2 z-10 my-2 flex w-full -translate-x-1/2 flex-col justify-center gap-1 rounded-2xl py-2 shadow-lg *:items-center">
                            {Array.from({ length: 7 }, (_, i) => i + 3).map(
                                (value) => (
                                    <div
                                        className="hover:bg-theme-form-container-border/20 flex w-full items-center justify-center bg-transparent py-2"
                                        key={value}
                                    >
                                        <span
                                            key={value}
                                            onClick={() => {
                                                updateRate('maxRating', value);
                                                setOpenScaleDialog(false);
                                            }}
                                            className={`cursor-pointer text-[20px]`}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
                <div className="border-theme-form-container-border/80 relative flex h-12 w-20 items-center justify-center rounded-md border">
                    <button
                        onClick={() => setOpenSymbolDialog(!openSymbolDialog)}
                        className="flex h-full w-full items-center justify-center"
                    >
                        <div className="material-symbols-outlined text-theme-form-on-container">
                            {Rate.symbol}
                        </div>
                        <div className="material-symbols-outlined text-theme-form-on-container justify-self-end text-[20px]">
                            arrow_drop_down
                        </div>
                    </button>
                    {openSymbolDialog && (
                        <div className="bg-theme-form-container absolute top-full left-1/2 z-10 my-2 flex w-full -translate-x-1/2 flex-col justify-center gap-1 rounded-2xl py-2 shadow-lg *:items-center">
                            {['kid_star', 'favorite', 'thumb_up']
                                .filter((a) => a !== Rate.symbol)
                                .map((icon) => (
                                    <div
                                        className="hover:bg-theme-form-container-border/20 flex w-full items-center justify-center bg-transparent py-2"
                                        key={icon}
                                    >
                                        <span
                                            key={icon}
                                            onClick={() => {
                                                updateRate('symbol', icon);
                                                setOpenSymbolDialog(false);
                                            }}
                                            className={`material-symbols-outlined cursor-pointer text-[20px] ${
                                                Rate.symbol === icon
                                                    ? 'text-theme-form-on-surface'
                                                    : 'text-theme-form-on-surface/60'
                                            }`}
                                        >
                                            {icon}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="my-3 flex items-center justify-evenly">
                {Array.from({ length: Rate.maxRating }, (_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-1 grid-rows-2 place-items-center"
                    >
                        <span className="my-2">{i + 1}</span>
                        <span
                            key={i}
                            className={`material-symbols-outlined text-theme-form-on-container ${
                                Rate.symbol === 'kid_star'
                                    ? 'text-[20px]'
                                    : 'text-[24px]'
                            }`}
                        >
                            {Rate.symbol}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
