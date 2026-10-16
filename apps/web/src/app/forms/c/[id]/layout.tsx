'use client';

import FormCreatePageCreateLayout from '@/features/forms/components/layouts/FormCreatePageCreateLayout';
import { FormProvider } from '@/features/forms/providers/form';
import type { ReactNode } from 'react';

export default function FormEditorLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <FormProvider>
            <FormCreatePageCreateLayout>{children}</FormCreatePageCreateLayout>
        </FormProvider>
    );
}
