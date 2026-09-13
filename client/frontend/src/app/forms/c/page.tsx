'use client';
import FormCreatePageCreateLayout from '@/features/forms/components/layouts/FormCreatePageCreateLayout';
import { FormCreateProvider } from '@/features/forms/providers/FormCreate';

function page() {
    return (
        <FormCreateProvider>
            <FormCreatePageCreateLayout />
        </FormCreateProvider>
    );
}

export default page;
