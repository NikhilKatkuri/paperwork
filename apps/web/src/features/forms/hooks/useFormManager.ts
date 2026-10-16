'use client';

import { FormDoc } from '@paperwork/types';
import { useState } from 'react';

export default function useFormManager(): object {
    const [form, setForm] = useState<FormDoc | undefined>(undefined);

    function initializeForm(form: FormDoc) {
        setForm(form);
    }

    function updateForm(updatedForm: FormDoc) {
        setForm(updatedForm);
    }

    return {
        form,
        initializeForm,
        updateForm,
    };
}
