'use client';

import { useState } from 'react';
import { useFormCreate } from '../../providers/FormCreate';
import { RatingConfig } from '../../types';

type RateIcon = 'kid_star' | 'favorite' | 'thumb_up';

const symbolMap: Record<RatingConfig['icon'], RateIcon> = {
    THUMB_UP: 'thumb_up',
    HEART: 'favorite',
    STAR: 'kid_star',
};

const reverseSymbolMap: Record<RateIcon, RatingConfig['icon']> = {
    thumb_up: 'THUMB_UP',
    favorite: 'HEART',
    kid_star: 'STAR',
};

const ALL_ICONS = Object.keys(reverseSymbolMap) as RateIcon[];

interface RateBuilderProps {
    config?: RatingConfig;
    id: string;
    onChange: (config: RatingConfig) => void;
}

export default function RatingBuilder({
    config = { icon: 'HEART', scale: 5 },
    onChange,
    id,
}: RateBuilderProps) {
    const { questions } = useFormCreate();

    // Single source of truth — no local mirror of ratingConfig.
    const rate: RatingConfig = questions.get(id)?.ratingConfig ?? config;

    const [openSymbolDialog, setOpenSymbolDialog] = useState(false);
    const [openScaleDialog, setOpenScaleDialog] = useState(false);

    const updateRate = <K extends keyof RatingConfig>(
        key: K,
        value: RatingConfig[K]
    ) => {
        onChange({ ...rate, [key]: value });
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
                            {rate.scale}
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
                                            onClick={() => {
                                                updateRate('scale', value);
                                                setOpenScaleDialog(false);
                                            }}
                                            className="cursor-pointer text-[20px]"
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
                            {symbolMap[rate.icon]}
                        </div>
                        <div className="material-symbols-outlined text-theme-form-on-container justify-self-end text-[20px]">
                            arrow_drop_down
                        </div>
                    </button>
                    {openSymbolDialog && (
                        <div className="bg-theme-form-container absolute top-full left-1/2 z-10 my-2 flex w-full -translate-x-1/2 flex-col justify-center gap-1 rounded-2xl py-2 shadow-lg *:items-center">
                            {ALL_ICONS.filter(
                                (glyph) => glyph !== symbolMap[rate.icon]
                            ).map((glyph) => (
                                <div
                                    className="hover:bg-theme-form-container-border/20 flex w-full items-center justify-center bg-transparent py-2"
                                    key={glyph}
                                >
                                    <span
                                        onClick={() => {
                                            updateRate(
                                                'icon',
                                                reverseSymbolMap[glyph]
                                            );
                                            setOpenSymbolDialog(false);
                                        }}
                                        className="material-symbols-outlined cursor-pointer text-[20px] text-theme-form-on-surface/60"
                                    >
                                        {glyph}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="my-3 flex items-center justify-evenly">
                {Array.from({ length: rate.scale }, (_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-1 grid-rows-2 place-items-center"
                    >
                        <span className="my-2">{i + 1}</span>
                        <span
                            className={`material-symbols-outlined text-theme-form-on-container ${
                                symbolMap[rate.icon] === 'kid_star'
                                    ? 'text-[20px]'
                                    : 'text-[24px]'
                            }`}
                        >
                            {symbolMap[rate.icon]}
                        </span>
                    </div>
                ))}
            </div>
            <div className="text-theme-form-on-surface/60 grid max-w-sm grid-cols-1 gap-2 p-2">
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">0</p>
                    <input
                        type="text"
                        value={rate.lowLabel ?? ''}
                        onChange={(e) =>
                            updateRate('lowLabel', e.target.value)
                        }
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">{rate.scale}</p>
                    <input
                        type="text"
                        value={rate.highLabel ?? ''}
                        onChange={(e) =>
                            updateRate('highLabel', e.target.value)
                        }
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
            </div>
        </div>
    );
}