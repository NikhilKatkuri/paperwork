import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from '@/components/ui/sonner';
import WelcomeDialog from '@/components/ui/WelcomeDialog';
import { AuthGuardProvider, AuthProvider } from '@/providers';
import { siteConfig } from '@/config/site';
import { StructuredData } from '@/components/ui/StructuredData';

const APP_NAME = siteConfig.name;

export const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
    display: 'swap',
    weight: ['400', '500', '600', '700', '800'],
    style: ['normal'],
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.siteUrl),
    title: APP_NAME,
    description: 'Build and fill forms',
    keywords: [
        'form builder',
        'online forms',
        'response collection',
        'form creator',
        'open source form builder',
        'Paperwork',
    ],
    authors: [{ name: 'Katkuri Nikhil', url: 'https://github.com/nikhilKatkuri' }],
    creator: 'Katkuri Nikhil',
    publisher: 'Paperwork',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteConfig.siteUrl,
        siteName: APP_NAME,
        title: `${APP_NAME} — Build and fill forms`,
        description: 'Build and fill forms',
        images: [
            {
                url: `${siteConfig.siteUrl}/icon-512.png`,
                width: 512,
                height: 512,
                alt: APP_NAME,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${APP_NAME} — Build and fill forms`,
        description: 'Build and fill forms',
        images: [`${siteConfig.siteUrl}/icon-512.png`],
    },
};

const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/icon-512.png`,
    sameAs: [siteConfig.repositoryUrl, siteConfig.maintainerProfileUrl],
};

const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: 'Build and fill forms',
    publisher: { '@type': 'Organization', name: siteConfig.name },
    potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.siteUrl}/help?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
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
                <StructuredData
                    organization={organizationSchema}
                    website={websiteSchema}
                />
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
