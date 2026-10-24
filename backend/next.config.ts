import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // The Dockerfile runs the standalone build.
    output: 'standalone',

    async redirects() {
        return [
            {
                source: '/',
                destination: '/admin',
                permanent: true,
            },
        ];
    },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
