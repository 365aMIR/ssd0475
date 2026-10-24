import type { GlobalConfig } from 'payload';
import { authenticated } from '@/hooks/authenticated';

// Shipping zones shown on the receipt. The visitor picks one before paying;
// Stripe then only accepts an address in that zone's countries and charges
// that zone's price.
export const ShopSettings: GlobalConfig = {
    slug: 'shop-settings',
    label: 'Shop instellingen',
    admin: {
        group: 'Shop',
    },
    access: {
        read: authenticated,
        update: authenticated,
    },
    fields: [
        {
            name: 'shippingZones',
            label: 'Verzendzones',
            type: 'array',
            minRows: 1,
            labels: { singular: 'Zone', plural: 'Zones' },
            defaultValue: [{ name: 'Nederland', countries: 'NL', price: 0 }],
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'name', label: 'Naam op het bonnetje', type: 'text', required: true, admin: { width: '40%' } },
                        {
                            name: 'countries',
                            label: 'Landcodes',
                            type: 'text',
                            required: true,
                            admin: { width: '40%', description: 'Met komma, bijv. BE,DE,FR' },
                        },
                        { name: 'price', label: 'Prijs (€)', type: 'number', required: true, min: 0, admin: { width: '20%', step: 0.01 } },
                    ],
                },
            ],
        },
    ],
};
