export interface Product {
    /** Stable key — the cart stores this, so don't rename it once live. */
    id: string;
    name: string;
    /** Small label on the card, bottom left. */
    code: string;
    /** In euros. */
    price: number;
    /** Yellow "new" tag; off shows the red southsidedinero tag instead. */
    isNew: boolean;
    sizes: string[];
    /** First one is the card image; all of them go in the popup slider. */
    photos: string[];
}

export const products: Product[] = [
    {
        id: 'sh01-rojo',
        name: 'Rojo hoodie',
        code: 'SH01 · rojo',
        price: 79,
        isNew: true,
        sizes: ['s', 'm', 'l', 'xl'],
        photos: ['/img/shop/rojo_front.jpg', '/img/shop/rojo_back.jpg'],
    },
    {
        id: 'sh01-angelo',
        name: 'Angelo hoodie',
        code: 'SH01 · angelo',
        price: 79,
        isNew: true,
        sizes: ['s', 'm', 'l', 'xl'],
        photos: ['/img/shop/angelo_front.jpg', '/img/shop/angelo_back.jpg'],
    },
];

/** null shows "nog te bepalen" on the receipt and leaves it out of the total. */
export const SHIPPING: number | null = null;

export const euro = (value: number) => '€ ' + value.toFixed(2).replace('.', ',');
