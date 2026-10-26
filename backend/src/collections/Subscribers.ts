import type { CollectionConfig } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// The mailing list from the shop's login screen: people who leave their
// address to hear about the drop. The shop adds them with its API key
// (shop/src/pages/api/subscribe.ts). Download them all as a CSV with the
// button above the list, or at /api/subscribers/export while logged in.
export const Subscribers: CollectionConfig = {
    slug: 'subscribers',
    labels: { singular: 'Inschrijving', plural: 'Inschrijvingen' },
    defaultSort: '-createdAt',
    admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'createdAt'],
        group: 'Website',
        description: 'Mailadressen van het inlogscherm. Wil iemand eraf: open de inschrijving en verwijder hem.',
        components: {
            beforeListTable: ['/components/SubscribersExport'],
        },
    },
    access: {
        read: authenticated,
        create: authenticated,
        update: authenticated,
        delete: authenticated,
    },
    hooks: {
        beforeValidate: [
            ({ data }) => {
                if (data?.email) data.email = String(data.email).trim().toLowerCase();
                return data;
            },
        ],
    },
    fields: [
        {
            name: 'email',
            label: 'Mailadres',
            type: 'email',
            required: true,
            unique: true,
            index: true,
        },
    ],
    endpoints: [
        {
            // GET /api/subscribers/export: the whole list as a CSV file.
            path: '/export',
            method: 'get',
            handler: async (req) => {
                if (!req.user) return Response.json({ error: 'Log eerst in.' }, { status: 401 });

                const { docs } = await req.payload.find({
                    collection: 'subscribers',
                    pagination: false,
                    sort: 'createdAt',
                    depth: 0,
                    req,
                });
                const rows = docs.map((doc) => `${doc.email},${doc.createdAt}`);
                const csv = ['email,date', ...rows].join('\n') + '\n';
                const date = new Date().toISOString().slice(0, 10);

                return new Response(csv, {
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename="southsidedinero-mailinglijst-${date}.csv"`,
                        'Cache-Control': 'no-store',
                    },
                });
            },
        },
    ],
    timestamps: true,
};
