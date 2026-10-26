// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Products } from './collections/Products';
import { Orders } from './collections/Orders';
import { Subscribers } from './collections/Subscribers';
import { ShopSettings } from './globals/ShopSettings';
import { SiteContent } from './globals/SiteContent';
import { stripeWebhook } from './stripe/webhook';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Same setup as flipmerktop's backend: MongoDB, photos in the Seaweed bucket.
// Without SEAWEED_BUCKET_NAME (local dev) uploads stay on disk in ./media.
const useS3 = Boolean(process.env.SEAWEED_BUCKET_NAME);

export default buildConfig({
    admin: {
        user: Users.slug,

        importMap: {
            baseDir: path.resolve(dirname),
        },

        meta: {
            titleSuffix: '- southsidedinero',

            icons: [
                {
                    url: '/assets/roermoney.png',
                    rel: 'icon',
                },
            ],
        },

        components: {
            graphics: {
                Logo: '/components/LoginLogo',
                Icon: '/components/BreadcrumbIcon',
            },
        },
    },

    collections: [Products, Orders, Subscribers, Media, Users],

    globals: [ShopSettings, SiteContent],

    endpoints: [stripeWebhook],

    editor: lexicalEditor(),

    secret: process.env.PAYLOAD_SECRET || '',

    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },

    db: mongooseAdapter({
        url: process.env.DATABASE_URI || '',
    }),

    sharp,

    graphQL: {
        disable: true,
    },

    plugins: [
        s3Storage({
            enabled: useS3,
            collections: {
                media: true,
            },
            bucket: process.env.SEAWEED_BUCKET_NAME || '',
            config: {
                endpoint: process.env.SEAWEED_ENDPOINT || '',
                region: 'eu-west-1',
                credentials: {
                    accessKeyId: process.env.SEAWEED_ACCESS_KEY || '',
                    secretAccessKey: process.env.SEAWEED_SECRET_KEY || '',
                },
                forcePathStyle: true,
            },
        }),
    ],
});
