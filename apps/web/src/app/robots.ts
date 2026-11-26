import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api',
                    '/user',
                    '/forms/c',
                    '/forms/v',
                    '/auth/reset-password/',
                ],
            },
        ],
        sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    };
}
