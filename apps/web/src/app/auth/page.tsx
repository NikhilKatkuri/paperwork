import { redirect } from 'next/navigation';

export default async function AuthPage({
    searchParams,
}: Readonly<{
    searchParams: Promise<{ mode?: string }>;
}>) {
    const { mode } = await searchParams;

    redirect(mode === 'signup' ? '/auth/signup?step=1' : '/auth/signin?step=1');
}
