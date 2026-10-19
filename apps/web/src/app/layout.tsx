import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from '@/components/ui/sonner';
import WelcomeDialog from '@/components/ui/WelcomeDialog';
import { AuthGuardProvider, AuthProvider } from '@/providers';
import { APP_NAME } from '@/lib/useDocumentTitle';

export const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
    display: 'swap',
    weight: ['400', '500', '600', '700', '800'],
    style: ['normal'],
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    title: APP_NAME,
    description: 'Build and fill forms',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${plusJakartaSans.variable} ${plusJakartaSans.className} h-full antialiased`}
        >
            <head>
                {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
                <link
                    rel="stylesheet"
                    referrerPolicy="no-referrer"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons+Extended"
                    rel="stylesheet"
                    referrerPolicy="no-referrer"
                />
            </head>
            <body className="flex min-h-full flex-col">
                <Toaster />
                <AuthProvider>
                    <AuthGuardProvider>{children}</AuthGuardProvider>
                </AuthProvider>
                <WelcomeDialog />
            </body>
        </html>
    );
}
