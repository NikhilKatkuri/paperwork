import type { NextConfig } from 'next';
import path from 'node:path';
 
const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.31.8'],
    turbopack: {
        root: path.resolve(process.cwd(), '../../'),
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
            }
        ],
    },
};

export default nextConfig;
