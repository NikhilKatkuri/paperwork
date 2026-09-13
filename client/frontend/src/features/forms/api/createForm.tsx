'use client';
import { useState } from 'react';
import { FormSettings, FormCore } from '../types';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';

interface createFormData extends Partial<FormSettings> {
    title: string;
    description: string;
    isPrivate: boolean;
    isPublished: boolean;
}

function useCreateForm() {
    const [loading, setLoading] = useState(false);

    const createForm = async (formData: createFormData) => {
        setLoading(true);
        try {
            const { path } = endpoints.forms.createForm;
            const res = await http.post<FormCore>(path, { data: formData });
            if (res.status === 201) {
                return {
                    ok: true,
                    data: res.data as FormCore,
                };
            }
            return { ok: false, error: 'Unexpected response from server.' };
        } catch (error) {
            let msg = 'An unexpected error occurred. Please try again.';
            if (error instanceof Error) {
                msg = error.message;
            }
            return { ok: false, error: msg };
        } finally {
            setLoading(false);
        }
    };
    return {
        loading,
        createForm,
    };
}

export default useCreateForm;
