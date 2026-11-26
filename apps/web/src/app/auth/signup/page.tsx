import type { Metadata } from 'next';
import SignUpPage from '@/auth/components/pages/SignUpPage';

export const metadata: Metadata = {
    title: 'Sign up | Paperwork',
    alternates: { canonical: '/auth/signup' },
};

function page() {
    return <SignUpPage />;
}

export default page;
