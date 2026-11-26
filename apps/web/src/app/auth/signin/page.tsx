import type { Metadata } from 'next';
import SignInPage from '@/auth/components/pages/SignInPage';

export const metadata: Metadata = {
    title: 'Sign in | Paperwork',
    alternates: { canonical: '/auth/signin' },
};

function page() {
    return <SignInPage />;
}

export default page;
