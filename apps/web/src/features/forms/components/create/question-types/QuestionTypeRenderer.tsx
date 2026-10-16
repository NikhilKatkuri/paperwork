'use client';
import React from 'react';
import {
    QuestionDoc,
    QuestionTypeEnum,
} from '@paperwork/types';
import ChoiceEditor from './ChoiceEditor';
import ScaleAndRatingEditor from './ScaleAndRatingEditor';

const QuestionTypeRendererObject: Record<
    Partial<QuestionTypeEnum>,
    React.ReactNode
> = {
    TEXT: wrapper({ label: 'Short answer text' }),
    PARAGRAPH: wrapper({ label: 'Long answer text' }),
    DATE: wrapper({ label: 'Date answer text', icon: 'calendar_month' }),
    TIME: wrapper({ label: 'Time answer text', icon: 'schedule' }),
    CHOICE: wrapper({
        label: 'Multiple choice answer text',
        icon: 'check_box',
    }),
    RADIO: wrapper({
        label: 'Single choice answer text',
        icon: 'radio_button_checked',
    }),
    DROP_DOWN: wrapper({
        label: 'Dropdown answer text',
        icon: 'arrow_drop_down_circle',
    }),
    LINEAR_SCALE: wrapper({
        label: 'Linear scale answer text',
        icon: 'linear_scale',
    }),
    RATING: wrapper({ label: 'Rating answer text', icon: 'star' }),
    [QuestionTypeEnum.MATRIX]: wrapper({
        label: 'Matrix answer text',
        icon: 'grid_view',
    }),
};

function wrapper({ label, icon }: { label: string; icon?: string }) {
    return (
        <div className="text-theme-form-on-container/90 border-theme-form-container-border/90 mx-3 grid max-w-56 grid-cols-[1fr_24px] items-center border-b border-dashed py-2">
            <p className="text-sm">{label}</p>
            <span className="material-symbols-outlined scale-90">{icon}</span>
        </div>
    );
}

interface QuestionTypeRendererProps {
    type: QuestionTypeEnum;
    id: string;
    update: (question: Partial<QuestionDoc>) => void;
}

function QuestionTypeRenderer({
    type,
    id,
    update,
}: Readonly<QuestionTypeRendererProps>) {
    if (
        type === QuestionTypeEnum.CHOICE ||
        type === QuestionTypeEnum.RADIO ||
        type === QuestionTypeEnum.DROP_DOWN
    ) {
        return (
            <ChoiceEditor
                id={id}
                type={type}
                onChange={(newOptions: QuestionDoc['optionsConfig']) => {
                    update({ optionsConfig: newOptions });
                }}
            />
        );
    }

    if (
        type === QuestionTypeEnum.RATING ||
        type === QuestionTypeEnum.LINEAR_SCALE
    ) {
        return (
            <ScaleAndRatingEditor
                id={id}
                type={type}
                onScaleChange={(config) => update({ scaleConfig: config })}
                onRatingChange={(config) => update({ ratingConfig: config })}
            />
        );
    }

    return <div>{QuestionTypeRendererObject[type]}</div>;
}

export default QuestionTypeRenderer;
