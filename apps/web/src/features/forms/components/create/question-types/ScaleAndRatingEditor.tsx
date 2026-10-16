'use client';
import { useForm } from '@/features/forms/providers/form';
import { 
    QuestionTypeEnum, 
    ScaleConfig, 
    RatingConfig, 
    LinearScaleQuestion, 
    RatingQuestion 
} from '@paperwork/types';
import { useState } from 'react';

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

interface ScaleAndRatingEditorProps {
    id: string;
    type: QuestionTypeEnum;
    onScaleChange: (config: ScaleConfig) => void;
    onRatingChange: (config: RatingConfig) => void;
}

export default function ScaleAndRatingEditor({
    id,
    type,
    onScaleChange,
    onRatingChange,
}: Readonly<ScaleAndRatingEditorProps>) {
    const { getQuestionById } = useForm();
    const question = getQuestionById(id);

    const [openSymbolDialog, setOpenSymbolDialog] = useState(false);
    const [openScaleDialog, setOpenScaleDialog] = useState(false);

    // Default configs
    const defaultScale: ScaleConfig = { lowerBound: 1, upperBound: 5, lowerLabel: '', upperLabel: '' };
    const defaultRating: RatingConfig = { icon: 'HEART', scale: 5, lowLabel: '', highLabel: '' };

    const scaleConfig: ScaleConfig = (question as LinearScaleQuestion)?.scaleConfig ?? defaultScale;
    const ratingConfig: RatingConfig = (question as RatingQuestion)?.ratingConfig ?? defaultRating;

    const updateScale = (key: keyof ScaleConfig, value: string | number) => {
        const newScale = { ...scaleConfig, [key]: value };
        onScaleChange(newScale);
    };

    const updateRating = <K extends keyof RatingConfig>(key: K, value: RatingConfig[K]) => {
        const newRating = { ...ratingConfig, [key]: value };
        onRatingChange(newRating);
    };
 
    if (type === QuestionTypeEnum.RATING) {
        return (
            <div className="flex flex-col gap-4 py-3 md:p-3">
                <div className="flex items-center gap-3"> 
                    <div className="border-theme-form-container-border/80 relative flex h-12 w-20 items-center justify-center rounded-md border">
                        <button
                            type="button"
                            onClick={() => setOpenScaleDialog(!openScaleDialog)}
                            className="flex h-full w-full items-center justify-center"
                        >
                            <div className="text-theme-form-on-container">{ratingConfig.scale}</div>
                            <div className="material-symbols-outlined text-theme-form-on-container justify-self-end text-[20px]">
                                arrow_drop_down
                            </div>
                        </button>
                        {openScaleDialog && (
                            <div className="bg-theme-form-container absolute top-full left-1/2 z-10 my-2 flex w-full -translate-x-1/2 flex-col justify-center gap-1 rounded-2xl py-2 shadow-lg *:items-center">
                                {Array.from({ length: 7 }, (_, i) => i + 3).map((value) => (
                                    <div
                                        className="hover:bg-theme-form-container-border/20 flex w-full items-center justify-center bg-transparent py-2"
                                        key={value}
                                    >
                                        <span
                                            onClick={() => {
                                                updateRating('scale', value as RatingConfig['scale']);
                                                setOpenScaleDialog(false);
                                            }}
                                            className="cursor-pointer text-[20px]"
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
 
                    <div className="border-theme-form-container-border/80 relative flex h-12 w-20 items-center justify-center rounded-md border">
                        <button
                            type="button"
                            onClick={() => setOpenSymbolDialog(!openSymbolDialog)}
                            className="flex h-full w-full items-center justify-center"
                        >
                            <div className="material-symbols-outlined text-theme-form-on-container">
                                {symbolMap[ratingConfig.icon]}
                            </div>
                            <div className="material-symbols-outlined text-theme-form-on-container justify-self-end text-[20px]">
                                arrow_drop_down
                            </div>
                        </button>
                        {openSymbolDialog && (
                            <div className="bg-theme-form-container absolute top-full left-1/2 z-10 my-2 flex w-full -translate-x-1/2 flex-col justify-center gap-1 rounded-2xl py-2 shadow-lg *:items-center">
                                {ALL_ICONS.filter((glyph) => glyph !== symbolMap[ratingConfig.icon]).map((glyph) => (
                                    <div
                                        className="hover:bg-theme-form-container-border/20 flex w-full items-center justify-center bg-transparent py-2"
                                        key={glyph}
                                    >
                                        <span
                                            onClick={() => {
                                                updateRating('icon', reverseSymbolMap[glyph]);
                                                setOpenSymbolDialog(false);
                                            }}
                                            className="material-symbols-outlined text-theme-form-on-surface/60 cursor-pointer text-[20px]"
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
                    {Array.from({ length: ratingConfig.scale }, (_, i) => (
                        <div key={i} className="grid grid-cols-1 grid-rows-2 place-items-center">
                            <span className="my-2">{i + 1}</span>
                            <span className="material-symbols-outlined text-theme-form-on-container text-[20px]">
                                {symbolMap[ratingConfig.icon]}
                            </span>
                        </div>
                    ))}
                </div>
 
                <div className="text-theme-form-on-surface/60 grid max-w-sm grid-cols-1 gap-2 p-2">
                    <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                        <p className="text-left font-semibold">1</p>
                        <input
                            type="text"
                            value={ratingConfig.lowLabel ?? ''}
                            onChange={(e) => updateRating('lowLabel', e.target.value)}
                            placeholder="Label (optional)"
                            className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                        />
                    </div>
                    <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                        <p className="text-left font-semibold">{ratingConfig.scale}</p>
                        <input
                            type="text"
                            value={ratingConfig.highLabel ?? ''}
                            onChange={(e) => updateRating('highLabel', e.target.value)}
                            placeholder="Label (optional)"
                            className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                        />
                    </div>
                </div>
            </div>
        );
    }
 
    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex items-center gap-3">
                <select
                    value={scaleConfig.lowerBound}
                    onChange={(e) => updateScale('lowerBound', parseInt(e.target.value, 10))}
                    className="bg-theme-form-container text-theme-form-on-surface cursor-pointer border-b border-dotted p-1 font-semibold outline-none"
                >
                    <option value={0} className="bg-theme-form-container">0</option>
                    <option value={1} className="bg-theme-form-container">1</option>
                </select>
                <p className="text-theme-form-on-surface/80">to</p>
                <select
                    value={scaleConfig.upperBound}
                    onChange={(e) => updateScale('upperBound', parseInt(e.target.value, 10))}
                    className="bg-theme-form-container text-theme-form-on-surface cursor-pointer border-b border-dotted p-1 font-semibold outline-none"
                >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num} className="bg-theme-form-container">
                            {num}
                        </option>
                    ))}
                </select>
            </div>

            <div className="text-theme-form-on-surface/60 grid max-w-sm grid-cols-1 gap-2 p-2">
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">{scaleConfig.lowerBound}</p>
                    <input
                        type="text"
                        value={scaleConfig.lowerLabel}
                        onChange={(e) => updateScale('lowerLabel', e.target.value)}
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
                <div className="grid h-10 grid-cols-[12px_1fr] items-center gap-2">
                    <p className="text-left font-semibold">{scaleConfig.upperBound}</p>
                    <input
                        type="text"
                        value={scaleConfig.upperLabel}
                        onChange={(e) => updateScale('upperLabel', e.target.value)}
                        placeholder="Label (optional)"
                        className="text-theme-form-on-surface focus:border-theme-form-on-surface/50 border-b border-dotted bg-transparent px-2 outline-none focus:border-solid"
                    />
                </div>
            </div>
        </div>
    );
}