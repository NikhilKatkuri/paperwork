export interface SampleField {
    label: string;
    type: string;
    required: boolean;
    rule?: string;
}

export interface SamplePreset {
    id: string;
    label: string;
    category: string;
    icon: string;
    title: string;
    description: string;
    fields: SampleField[];
}

export const samplePresets: SamplePreset[] = [
    {
        id: 'leave-request',
        label: 'Leave Request',
        category: 'Work',
        icon: 'event_available',
        title: 'Leave Request',
        description:
            'A time-off request with date fields and a minimum-length reason.',
        fields: [
            { label: 'Employee name', type: 'Short text', required: true },
            { label: 'Leave type', type: 'Dropdown', required: true },
            { label: 'Start date', type: 'Date', required: true },
            { label: 'End date', type: 'Date', required: true },
            {
                label: 'Reason',
                type: 'Long text',
                required: true,
                rule: 'Min 10 chars',
            },
        ],
    },
    {
        id: 'service-agreement',
        label: 'Service Agreement',
        category: 'Work',
        icon: 'description',
        title: 'Service Agreement Intake',
        description:
            'Capture client details, service scope, and a validated signatory email.',
        fields: [
            { label: 'Client name', type: 'Short text', required: true },
            { label: 'Company', type: 'Short text', required: true },
            { label: 'Service scope', type: 'Long text', required: true },
            { label: 'Effective date', type: 'Date', required: true },
            {
                label: 'Signatory email',
                type: 'Email',
                required: true,
                rule: 'Valid email',
            },
        ],
    },
    {
        id: 'expense-claim',
        label: 'Expense Claim',
        category: 'Work',
        icon: 'receipt_long',
        title: 'Expense Reimbursement Claim',
        description:
            'Standardize reimbursements with a category, amount check, and receipt note.',
        fields: [
            { label: 'Claimant', type: 'Short text', required: true },
            { label: 'Expense date', type: 'Date', required: true },
            { label: 'Category', type: 'Dropdown', required: true },
            {
                label: 'Amount',
                type: 'Number',
                required: true,
                rule: 'Greater than 0',
            },
            { label: 'Receipt note', type: 'Long text', required: false },
        ],
    },
];
