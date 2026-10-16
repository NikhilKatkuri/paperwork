'use client';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { CreateFormDoc, FormDto } from '@paperwork/types';

function useCreateForm() {
    const { loading, execute: createForm } = useApiAction(
        async (formData: CreateFormDoc) => {
            // `isPublished` and `responseCount` are server-owned: the API
            // rejects them as unrecognized keys, and the server forces its
            // own defaults regardless.
            const payload: Record<string, unknown> = { ...formData };
            delete payload.isPublished;
            delete payload.responseCount;
            return http.post<FormDto>(endpoints.forms.createForm, {
                data: payload,
            });
        }
    );

    return {
        loading,
        createForm,
    };
}

export default useCreateForm;
