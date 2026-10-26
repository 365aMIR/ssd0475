import type { CollectionConfig } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// Admin accounts. The shop also logs in as a user, with an API key: make a
// user "shop", tick "Enable API Key" and put that key in the shop's BACKEND_API_KEY.
export const Users: CollectionConfig = {
    slug: 'users',
    labels: { singular: 'Gebruiker', plural: 'Gebruikers' },
    admin: {
        useAsTitle: 'email',
        group: 'Beheer',
    },
    auth: {
        useAPIKey: true,
    },
    access: {
        read: authenticated,
        create: authenticated,
        update: authenticated,
        delete: authenticated,
    },
    fields: [],
};
