import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Form templates | Paperwork',
    alternates: { canonical: '/forms/templates' },
};

export default function TemplatesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
