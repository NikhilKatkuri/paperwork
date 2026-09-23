import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.31.8','172.19.0.1'],
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '192.168.31.8',
                port: '3000',
                pathname: '/**',
            },
                        {
                protocol: 'http',
                hostname: '172.19.0.1',
                port: '3000',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
