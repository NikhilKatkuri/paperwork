import { QuestionType, QuestionTypeEnum } from '@paperwork/types';

export const questionTypesMap: Record<QuestionType, { label: string; icon: string }> = {
    [QuestionTypeEnum.TEXT]: { label: 'Short Answer', icon: 'short_text' },
    [QuestionTypeEnum.PARAGRAPH]: { label: 'Paragraph', icon: 'notes' },
    [QuestionTypeEnum.DATE]: { label: 'Date', icon: 'calendar_today' },
    [QuestionTypeEnum.TIME]: { label: 'Time', icon: 'schedule' },
    [QuestionTypeEnum.CHOICE]: { label: 'Multiple Choice', icon: 'check_box' },
    [QuestionTypeEnum.RADIO]: {
        label: 'Single Choice',
        icon: 'radio_button_checked',
    },
    [QuestionTypeEnum.DROP_DOWN]: {
        label: 'Dropdown',
        icon: 'arrow_drop_down_circle',
    },
    [QuestionTypeEnum.LINEAR_SCALE]: {
        label: 'Linear Scale',
        icon: 'linear_scale',
    },
    [QuestionTypeEnum.RATING]: { label: 'Rating', icon: 'star' },
    [QuestionTypeEnum.MATRIX]: { label: 'Matrix', icon: 'grid_view' },
} as const;
