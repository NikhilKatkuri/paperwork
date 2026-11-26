import type { Metadata } from 'next';
import ForgotPasswordPage from '@/auth/components/pages/ForgotPasswordPage';

export const metadata: Metadata = {
    title: 'Forgot password | Paperwork',
    alternates: { canonical: '/auth/forgot-password' },
};

function page() {
    return <ForgotPasswordPage />;
}

export default page;
