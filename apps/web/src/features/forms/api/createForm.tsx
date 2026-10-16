'use client';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { CreateFormDoc, FormDto } from '@paperwork/types';

function useCreateForm() {
    const { loading, execute: createForm } = useApiAction(
        async (formData: CreateFormDoc) =>
            http.post<FormDto>(endpoints.forms.createForm, {
                data: formData,
            })
    );

    return {
        loading,
        createForm,
    };
}

export default useCreateForm;
