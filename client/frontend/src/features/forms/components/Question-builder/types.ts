
export enum QUESTION_TYPE {
    TEXT = 'TEXT',
    PARAGRAPH = 'PARAGRAPH',
    DATE = 'DATE',
    TIME = 'TIME',
    CHOICE = 'CHOICE',
    RADIO = 'RADIO',
    DROP_DOWN = 'DROP_DOWN',
    LINEAR_SCALE = 'LINEAR_SCALE',
    RATING = 'RATING',
}

export type OptionType = QUESTION_TYPE.CHOICE | QUESTION_TYPE.RADIO | QUESTION_TYPE.DROP_DOWN;
export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

export const questionTypesMap = {
    [QUESTION_TYPE.TEXT]: { label: 'Short Answer', icon: 'short_text' },
    [QUESTION_TYPE.PARAGRAPH]: { label: 'Paragraph', icon: 'notes' },
    [QUESTION_TYPE.DATE]: { label: 'Date', icon: 'calendar_today' },
    [QUESTION_TYPE.TIME]: { label: 'Time', icon: 'schedule' },
    [QUESTION_TYPE.CHOICE]: { label: 'Multiple Choice', icon: 'check_box' },
    [QUESTION_TYPE.RADIO]: {
        label: 'Single Choice',
        icon: 'radio_button_checked',
    },
    [QUESTION_TYPE.DROP_DOWN]: {
        label: 'Dropdown',
        icon: 'arrow_drop_down_circle',
    },
    [QUESTION_TYPE.LINEAR_SCALE]: {
        label: 'Linear Scale',
        icon: 'linear_scale',
    },
    [QUESTION_TYPE.RATING]: { label: 'Rating', icon: 'star' },
} as const;
