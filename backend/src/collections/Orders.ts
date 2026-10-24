import type { CollectionConfig } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// Orders are made by the Stripe webhook (src/stripe/webhook.ts) after a
// payment succeeds, never by hand. You only change the status: betaald →
// verzonden. Refunds go through the Stripe dashboard.
export const Orders: CollectionConfig = {
    slug: 'orders',
    labels: { singular: 'Bestelling', plural: 'Bestellingen' },
    admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'name', 'total', 'status', 'createdAt'],
        group: 'Shop',
    },
    defaultSort: '-createdAt',
    access: {
        read: authenticated,
        create: () => false,
        update: authenticated,
        delete: authenticated,
    },
    fields: [
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'paid',
            options: [
                { label: 'Betaald, nog versturen', value: 'paid' },
                { label: 'Verzonden', value: 'shipped' },
                { label: 'Terugbetaald / geannuleerd', value: 'cancelled' },
            ],
            admin: { position: 'sidebar' },
        },
        {
            name: 'trackAndTrace',
            label: 'Track & trace',
            type: 'text',
            admin: { position: 'sidebar' },
        },
        {
            type: 'row',
            fields: [
                { name: 'name', label: 'Naam', type: 'text', admin: { readOnly: true, width: '50%' } },
                { name: 'email', label: 'Mail', type: 'email', admin: { readOnly: true, width: '50%' } },
            ],
        },
        { name: 'phone', label: 'Telefoon', type: 'text', admin: { readOnly: true } },
        {
            name: 'address',
            label: 'Verzendadres',
            type: 'group',
            admin: { readOnly: true },
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'line1', label: 'Adres', type: 'text', admin: { width: '50%' } },
                        { name: 'line2', label: 'Adres 2', type: 'text', admin: { width: '50%' } },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        { name: 'postalCode', label: 'Postcode', type: 'text', admin: { width: '33%' } },
                        { name: 'city', label: 'Plaats', type: 'text', admin: { width: '33%' } },
                        { name: 'country', label: 'Land', type: 'text', admin: { width: '33%' } },
                    ],
                },
            ],
        },
        {
            name: 'items',
            label: 'Producten',
            type: 'array',
            admin: { readOnly: true },
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'name', label: 'Product', type: 'text', admin: { width: '40%' } },
                        { name: 'size', label: 'Maat', type: 'text', admin: { width: '20%' } },
                        { name: 'quantity', label: 'Aantal', type: 'number', admin: { width: '20%' } },
                        { name: 'unitPrice', label: 'Prijs (€)', type: 'number', admin: { width: '20%' } },
                    ],
                },
                { name: 'product', type: 'relationship', relationTo: 'products' },
            ],
        },
        {
            type: 'row',
            fields: [
                { name: 'shippingMethod', label: 'Verzending', type: 'text', admin: { readOnly: true, width: '33%' } },
                { name: 'shippingCost', label: 'Verzendkosten (€)', type: 'number', admin: { readOnly: true, width: '33%' } },
                { name: 'total', label: 'Totaal betaald (€)', type: 'number', admin: { readOnly: true, width: '33%' } },
            ],
        },
        { name: 'notes', label: 'Notities', type: 'textarea' },
        {
            name: 'stripeSessionId',
            label: 'Stripe sessie',
            type: 'text',
            unique: true,
            index: true,
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'stripePaymentIntent',
            label: 'Stripe betaling',
            type: 'text',
            admin: { readOnly: true, position: 'sidebar', description: 'Zoek deze op in Stripe voor terugbetalen.' },
        },
    ],
};
