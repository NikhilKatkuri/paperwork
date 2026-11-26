import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { LandingNavbar } from '@/features/landing/components/LandingNavbar';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { Hero } from '@/features/landing/components/Hero';
import { Statement } from '@/features/landing/components/Statement';
import { FeatureSections } from '@/features/landing/components/FeatureSections';
import { SampleSwitcher } from '@/features/landing/components/SampleSwitcher';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { BottomCta } from '@/features/landing/components/BottomCta';

const title = `${siteConfig.name} — Form builder & response collection`;
const description =
    'An open-source form builder and response collection app. Create forms, publish a shareable link, review submissions, and export them as CSV.';

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteConfig.siteUrl,
        siteName: siteConfig.name,
        title,
        description,
        images: [
            {
                url: `${siteConfig.siteUrl}/icon-512.png`,
                width: 512,
                height: 512,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${siteConfig.siteUrl}/icon-512.png`],
    },
};

export default function Home() {
    return (
        <div className="bg-theme-surface text-theme-on-surface flex min-h-dvh flex-col">
            <LandingNavbar />
            <main id="content" className="flex-1">
                <Hero />
                <Statement />
                <FeatureSections />
                <SampleSwitcher />
                <HowItWorks />
                <BottomCta />
            </main>
            <LandingFooter />
        </div>
    );
}
