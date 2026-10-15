'use client';
import React from 'react'; 
import OptionBuilder from './OptionBuilder'; 
import ScaleBuilder from './ScaleBuilder';
import RatingBuilder from './RatingBuilder';
import { QUESTION_TYPE, QuestionType } from '../../common/types';
import QuestionCore from '@/features/forms/types/question.type';

interface AnswerTemplateProps {
    type: QuestionType;
    update: (patch: Partial<QuestionCore>) => void;
    id: number;
}

function wrapper({ label, icon }: { label: string; icon?: string }) {
    return (
        <div className="text-theme-form-on-container/90 border-theme-form-container-border/90 mx-3 grid max-w-56 grid-cols-[1fr_24px] items-center border-b border-dashed py-2">
            <p className="text-sm">{label}</p>
            <span className="material-symbols-outlined scale-90">{icon}</span>
        </div>
    );
}

const AnswerTemplateObject: Record<Partial<QuestionType>, React.ReactNode> = {
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
};

function AnswerTemplate({ type, update, id }: Readonly<AnswerTemplateProps>) {
    if(type === QUESTION_TYPE.CHOICE || type === QUESTION_TYPE.RADIO || type === QUESTION_TYPE.DROP_DOWN) {
            return <OptionBuilder id={id} type={type} onOptionsChange={(data)=> update({ options: data })} />;
    }
    if(type === QUESTION_TYPE.RATING) {
        return <RatingBuilder id={id} onChange={(config) => update({ ratingConfig: config })} />
    }
    if(type === QUESTION_TYPE.LINEAR_SCALE) {
        return <ScaleBuilder id={id} />
    }
    return <div>{AnswerTemplateObject[type]}</div>;
}

export default AnswerTemplate;
