'use client';

import useCreateForm from '@/features/forms/api/createForm';
import formRepository from '@/features/forms/repositories/formRepository';
import {
    DEFAULT_FORM_CORE,
    DEFAULT_QUESTION_CORE,
    DEFAULT_SECTION_CORE,
} from '@/features/forms/utils/default';
import { FormDB } from '@/lib/db';
import { redirect } from 'next/navigation';
import { useRef } from 'react';

function UserFab() {
    const { loading, createForm } = useCreateForm();
    const stateRef = useRef(false);
    
    const handleClick = async () => {
        if (stateRef.current || loading) return;

        let createdFormId: string | null = null;

        try {
            stateRef.current = true;

            const res = await createForm(DEFAULT_FORM_CORE);
            console.log(res);
            if (!res?.ok) throw new Error('Failed to create form');

            const form = (res.data as { data?: { form?: FormDB } })?.data?.form;
            if (!form?._id) throw new Error('Invalid form payload returned');

            await formRepository.save({
                ...form,
                sections: [DEFAULT_SECTION_CORE],
                questions: [DEFAULT_QUESTION_CORE],
            });
            createdFormId = form._id;
        } catch (error) {
            console.error('Form creation failed:', error);
            stateRef.current = false;
            return;
        }

        if (createdFormId) {
            redirect(`/forms/c/${createdFormId}`);
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
