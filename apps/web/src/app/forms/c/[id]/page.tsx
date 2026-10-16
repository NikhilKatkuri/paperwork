'use client';
import FormCreatePageCreateLayout from '@/features/forms/components/layouts/FormCreatePageCreateLayout';
import { FormProvider } from '@/features/forms/providers/form';

function Page() {
    return (
        <FormProvider>
            <FormCreatePageCreateLayout />
        </FormProvider>
    );
}

export default Page;
