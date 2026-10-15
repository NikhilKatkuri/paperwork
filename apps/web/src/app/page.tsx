import { redirect } from 'next/navigation';

export default function Home() {
    redirect('/auth/signin?step=1');
}
