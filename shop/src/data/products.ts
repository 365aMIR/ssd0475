// Live, the products come from the Payload admin (lib/backend.server.ts).
// This file is the fallback for local dev without the admin, and the types.

export interface Product {
    /** Stable key — the cart stores this, so don't rename it once live. */
    id: string;
    name: string;
    /** Small label on the card, bottom left. */
    code: string;
    /** Popup text, one paragraph per entry. Leave empty to hide the block. */
    description: string[];
    /** In euros. */
    price: number;
    /** Yellow "new" tag; off shows the red southsidedinero tag instead. */
    isNew: boolean;
    sizes: string[];
    /** Sizes with stock 0: shown, but can't be picked. */
    soldOut?: string[];
    /** Stock per size, null = not tracked. */
    stock?: Record<string, number | null>;
    /**
     * First one is the card image; all of them go in the popup slider.
     * Files live in private/products/ and are served by /shop-img/, so they stay
     * hidden while the site is locked (see lib/lock.server.ts).
     */
    photos: string[];
    /** Class put on the receipt while this product is in the cart (stripes, see blocks/_cart.scss). */
    cartClass?: string;
}

export const products: Product[] = [
    {
        id: 'sh01-rojo',
        name: 'Rojo hoodie',
        code: 'SH01 · rojo',
        description: ['[380gsm 100% cotton]', '[true to size]'],
        price: 79,
        isNew: true,
        sizes: ['s', 'm', 'l', 'xl'],
        photos: ['/shop-img/rojo_front.jpg', '/shop-img/rojo_back.jpg'],
        cartClass: 'rojo',
    },
    {
        id: 'sh01-angelo',
        name: 'Angelo hoodie',
        code: 'SH01 · angelo',
        description: ['[380gsm 100% cotton]', '[true to size]'],
        price: 79,
        isNew: true,
        sizes: ['s', 'm', 'l', 'xl'],
        photos: ['/shop-img/angelo_front.jpg', '/shop-img/angelo_back.jpg'],
        cartClass: 'angelo',
    },
];

/** A shipping zone from the admin's Shop instellingen, picked on the receipt. */
export interface ShippingZone {
    name: string;
    /** Two-letter country codes Stripe accepts for this zone. */
    countries: string[];
    /** In euros. */
    price: number;
}

export const euro = (value: number) => '€ ' + value.toFixed(2).replace('.', ',');
