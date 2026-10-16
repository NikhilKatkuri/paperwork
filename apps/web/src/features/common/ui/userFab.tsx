'use client';

import useCreateForm from '@/features/forms/api/createForm';
import formRepository from '@/features/forms/repositories/formRepository';
import { createDefaultForm } from '@/features/forms/utils/default';
import { useAuth } from '@/providers';
import { FormDto } from '@paperwork/types';
import { useRef } from 'react';
import { toast } from 'sonner';

function UserFab() {
    const { loading, createForm } = useCreateForm();
    const stateRef = useRef(false);
    const { decodedToken } = useAuth();

    const handleClick = async () => {
        if (stateRef.current || loading) return;

        let createdFormId: string | null = null;

        try {
            stateRef.current = true;
            const defaultForm = createDefaultForm();

            const res = await createForm(defaultForm);

            if (!res.ok) {
                console.error('Failed to create form on server:', res.error);
                toast.error(res.error || 'Failed to create form');
                return;
            }

            if (!res.data || !res.data.id) {
                console.error(
                    'Form creation returned no form id:',
                    res.data
                );
                toast.error('Server did not return the new form. Try again.');
                return;
            }

            const formDto: FormDto = res.data;
            createdFormId = formDto.id;

            await formRepository.save({
                ...formDto,
                userId: formDto.userId ?? decodedToken?.userId ?? '',
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Form creation failed';
            console.error('Form creation failed:', message);
            toast.error(message);
            stateRef.current = false;
            return;
        }

        if (createdFormId) {
            window.location.href = `/forms/c/${createdFormId}`;
        }
    };

    return (
        <div className="fixed right-6 bottom-24 md:right-24">
            <button
                onClick={handleClick}
                className="bg-theme-form-container-active z-10 flex h-10 w-10 items-center justify-center rounded-2xl shadow transition-all ease-in-out active:scale-95 md:scale-120"
            >
                <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                </svg>
            </button>
        </div>
    );
}

export default UserFab;
