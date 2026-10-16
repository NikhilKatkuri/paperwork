type ActionType = 'NEXT_SECTION' | 'GO_TO_SECTION' | 'SUBMIT_FORM';
type ConditionOperator =
    'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';

interface SectionAction {
    type: ActionType;
    targetSectionId?: string;
}

interface SectionRule {
    questionId: string;
    operator: ConditionOperator;
    expectedValue: string | number | boolean;
    action: SectionAction;
}

interface Section {
    index: number;
    title: string;
    description?: string;
    rules?: SectionRule[];
    defaultAction?: SectionAction;
}

export type {
    Section,
    SectionRule,
    SectionAction,
    ActionType,
    ConditionOperator,
};
