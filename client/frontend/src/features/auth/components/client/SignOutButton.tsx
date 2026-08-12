'use client';

import { useAuth } from '@/providers';
import { toast } from 'sonner';

const SignOutButton = () => {
    const { signOut, setAccessToken } = useAuth();
    const { loading, handleSignOut } = signOut;

    const handleSubmit = async () => {
        const result = await handleSignOut();
        if (result.ok) {
            toast.success('Signed out successfully');
            setAccessToken(null);
        } else if (result.error) {
            toast.error(result.error);
        }
    };
    return (
        <button
            className="bg-brand-depth text-on-brand-depth px-4 py-3"
            onClick={handleSubmit}
        >
            {loading ? 'Signing out...' : 'Sign Out'}
        </button>
    );
};

export default SignOutButton;
