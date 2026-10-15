'use client';

import FormViewPageLayout from '@/features/forms/components/layouts/FormViewPageLayout';

function Page() {
    /**
     * Deliberately not wrapped in `FormCreateProvider`: that provider saves to
     * IndexedDB and schedules a sync, so merely viewing a form would mark it
     * dirty and push it upstream.
     */
    return <FormViewPageLayout />;
}

export default Page;
