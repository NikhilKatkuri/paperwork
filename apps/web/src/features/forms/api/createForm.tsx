'use client';
import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { useApiAction } from '@/hooks/useApiAction';
import { playFormCreatedSound } from '@/features/forms/utils/sound';
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
            const res = await http.post<FormDto>(endpoints.forms.createForm, {
                data: payload,
            });

            // Only a settled creation with a real form id counts as success;
            // this never fires on click or on a failed request.
            if (res.data?.id) {
                playFormCreatedSound();
            }

            return res;
        }
    );

    return {
        loading,
        createForm,
    };
}

export default useCreateForm;
