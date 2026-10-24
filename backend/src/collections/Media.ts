import type { CollectionConfig } from 'payload';
import path from 'node:path';
import { authenticated } from '@/hooks/authenticated';

// Uploaded photos. Private like everything else: the shop fetches them with
// its API key and serves them through its own /shop-img/ route, so product
// photos can't be found before the drop.
//
// On Coolify the files go to the Seaweed bucket (see payload.config.ts); the
// local folder is only used in development.
export const Media: CollectionConfig = {
    slug: 'media',
    labels: { singular: 'Foto', plural: "Foto's" },
    admin: {
        group: 'Shop',
    },
    access: {
        read: authenticated,
        create: authenticated,
        update: authenticated,
        delete: authenticated,
    },
    fields: [
        {
            name: 'alt',
            label: 'Omschrijving (voor schermlezers)',
            type: 'text',
        },
    ],
    hooks: {
        // Same as flipmerktop: no spaces in file names.
        beforeChange: [
            async ({ data }) => {
                if (data?.filename) data.filename = data.filename.replace(/\s+/g, '-');
                return data;
            },
        ],
    },
    upload: {
        staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
        mimeTypes: ['image/*'],
    },
};
