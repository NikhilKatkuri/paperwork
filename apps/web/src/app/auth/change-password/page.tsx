import type { Metadata } from 'next';
import ChangePasswordPage from '@/auth/components/pages/ChangePasswordPage';

export const metadata: Metadata = {
    title: 'Change password | Paperwork',
    alternates: { canonical: '/auth/change-password' },
};

function page() {
    return <ChangePasswordPage />;
}

export default page;
