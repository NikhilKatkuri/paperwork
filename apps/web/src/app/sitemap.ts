import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

const publicRoutes = [
    '',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/forms/templates',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return publicRoutes.map((route) => ({
        url: `${siteConfig.siteUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: route === '' ? 1 : 0.8,
    }));
}
