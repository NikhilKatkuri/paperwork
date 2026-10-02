type SectionAction =
    | { actionType: 'NEXT_SECTION' }
    | { actionType: 'GO_TO_SECTION'; sectionId: string }
    | { actionType: 'SUBMIT_FORM' };

interface SectionDependsOn {
    questionId: string;
    value: string;
    action: SectionAction;
}

interface SectionCore {
    /** Mongo-compatible id - required by the bulk sync endpoint. */
    _id: string;
    index: number;
    title: string;
    description?: string;
    onAnswer?: SectionDependsOn[];
    defaultAction?: SectionAction;
}

export type defualtSectionCore = Map<number, SectionCore>
export type { SectionAction, SectionDependsOn };
export default SectionCore;