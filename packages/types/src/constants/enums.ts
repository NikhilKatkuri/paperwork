export const FORM_THEMES = [
    'default',
    'blue',
    'orange',
    'green',
    'purple',
    'red',
    'teal',
    'amber',
    'slate',
    'emerald',
] as const;

export type FormTheme = (typeof FORM_THEMES)[number];

export const sectionActionEnum = [
    'NEXT_SECTION',
    'GO_TO_SECTION',
    'SUBMIT_FORM',
] as const;

export type SectionActionType = (typeof sectionActionEnum)[number];

export enum QuestionTypeEnum {
    TEXT = 'TEXT',
    PARAGRAPH = 'PARAGRAPH',
    DATE = 'DATE',
    TIME = 'TIME',
    CHOICE = 'CHOICE',
    RADIO = 'RADIO',
    DROP_DOWN = 'DROP_DOWN',
    LINEAR_SCALE = 'LINEAR_SCALE',
    RATING = 'RATING',
    MATRIX = 'MATRIX',
}

export type QuestionType =
    (typeof QuestionTypeEnum)[keyof typeof QuestionTypeEnum];

export const COUNTRIES = {
    India: 'India',
    USA: 'USA',
    Germany: 'Germany',
    France: 'France',
    Japan: 'Japan',
    Australia: 'Australia',
    China: 'China',
    Other: 'Other',
} as const;

export type Country = (typeof COUNTRIES)[keyof typeof COUNTRIES];

export const LANGUAGES = [
    'English',
    'Hindi',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Other',
] as const;

export type Language = (typeof LANGUAGES)[number];

export const GENDERS = {
    MALE: 'male',
    FEMALE: 'female',
    NON_BINARY: 'non-binary',
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export const userAccountDeletedStatus = {
    DELETED: 'deleted',
    PENDING_DELETION: 'pending_deletion',
} as const;

export type UserAccountDeletedStatus =
    (typeof userAccountDeletedStatus)[keyof typeof userAccountDeletedStatus];

export const userAccountDeactivationStatus = {
    DEACTIVATED: 'deactivated',
    PENDING_DEACTIVATION: 'pending_deactivation',
} as const;

export type UserAccountDeactivationStatus =
    (typeof userAccountDeactivationStatus)[keyof typeof userAccountDeactivationStatus];
