'use client';

import TemplateGallery from '@/features/forms/components/templates/TemplateGallery';
import Dashboard from '@/features/user/components/layouts/Dashboard';

const TemplatesPage = () => {
    return (
        <Dashboard>
            <TemplateGallery />
        </Dashboard>
    );
};

export default TemplatesPage;
