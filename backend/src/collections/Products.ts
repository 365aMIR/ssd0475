import type { CollectionConfig } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// The hoodies (and later more). Drafts are on: a product saved as concept
// isn't sent to the shop, only published ones are. Keep the next drop in
// concept until drop day.
export const Products: CollectionConfig = {
    slug: 'products',
    labels: { singular: 'Product', plural: 'Producten' },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'code', 'price', '_status', 'order'],
        group: 'Shop',
    },
    versions: {
        drafts: true,
    },
    defaultSort: 'order',
    access: {
        read: authenticated,
        create: authenticated,
        update: authenticated,
        delete: authenticated,
    },
    fields: [
        {
            type: 'row',
            fields: [
                { name: 'name', label: 'Naam', type: 'text', required: true, admin: { width: '50%' } },
                {
                    name: 'slug',
                    label: 'ID',
                    type: 'text',
                    required: true,
                    unique: true,
                    index: true,
                    admin: {
                        width: '50%',
                        description: 'Vaste code, bijv. sh01-rojo. Winkelmandjes onthouden deze, dus niet meer wijzigen als hij live staat.',
                    },
                },
            ],
        },
        {
            type: 'row',
            fields: [
                { name: 'code', label: 'Label op de kaart', type: 'text', admin: { width: '50%', description: 'Bijv. SH01 · rojo' } },
                {
                    name: 'price',
                    label: 'Prijs (€, incl. btw)',
                    type: 'number',
                    required: true,
                    min: 0,
                    admin: { width: '25%', step: 0.01 },
                },
                {
                    name: 'order',
                    label: 'Volgorde',
                    type: 'number',
                    defaultValue: 0,
                    admin: { width: '25%', description: 'Lager = eerder' },
                },
            ],
        },
        {
            name: 'isNew',
            label: 'Geel "new" label (uit = rood southsidedinero label)',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'description',
            label: 'Omschrijving in de popup',
            type: 'textarea',
            admin: { description: 'Elke regel wordt een eigen alinea.' },
        },
        {
            name: 'photos',
            label: "Foto's",
            type: 'upload',
            relationTo: 'media',
            hasMany: true,
            required: true,
            admin: { description: 'De eerste is de kaartfoto, de tweede verschijnt bij hover.' },
        },
        {
            name: 'sizes',
            label: 'Maten en voorraad',
            type: 'array',
            minRows: 1,
            labels: { singular: 'Maat', plural: 'Maten' },
            admin: { initCollapsed: false },
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'size', label: 'Maat', type: 'text', required: true, admin: { width: '50%' } },
                        {
                            name: 'stock',
                            label: 'Voorraad',
                            type: 'number',
                            min: 0,
                            admin: { width: '50%', description: 'Leeg = niet bijhouden. Gaat automatisch omlaag na een betaling.' },
                        },
                    ],
                },
            ],
        },
        {
            name: 'cartClass',
            label: 'Bonnetje-class',
            type: 'text',
            admin: {
                position: 'sidebar',
                description: 'Class op het bonnetje als dit product in de cart zit (strepen, zie _cart.scss). Bijv. rojo.',
            },
        },
    ],
};
