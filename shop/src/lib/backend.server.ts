import { products as localProducts, type Product, type ShippingZone } from '../data/products';

/**
 * The shop's line to the Payload admin (../backend), set up like flipmerktop:
 * BACKEND_ENDPOINT is the admin's URL. Unlike flipmerktop everything in this
 * admin is private, so the shop logs in with an API key (BACKEND_API_KEY, from
 * the "shop" user in the admin).
 *
 * Without BACKEND_ENDPOINT (local dev without the admin running) the shop
 * falls back to src/data/products.ts, so it keeps working.
 */
const endpoint = () => process.env.BACKEND_ENDPOINT?.replace(/\/$/, '') || '';
export const hasBackend = () => Boolean(endpoint());

export function backendFetch(path: string, init: RequestInit = {}) {
    return fetch(`${endpoint()}${path}`, {
        ...init,
        headers: {
            ...(init.headers as Record<string, string>),
            Authorization: `users API-Key ${process.env.BACKEND_API_KEY ?? ''}`,
        },
    });
}

interface PayloadMedia {
    filename?: string | null;
}

interface PayloadProduct {
    slug: string;
    name: string;
    code?: string | null;
    price: number;
    isNew?: boolean | null;
    description?: string | null;
    photos?: (PayloadMedia | string | number)[] | null;
    sizes?: { size: string; stock?: number | null }[] | null;
    cartClass?: string | null;
}

interface PayloadSettings {
    shippingZones?: { name?: string | null; countries?: string | null; price?: number | null }[] | null;
}

export interface Catalog {
    products: Product[];
    zones: ShippingZone[];
}

const toProduct = (doc: PayloadProduct): Product => ({
    id: doc.slug,
    name: doc.name,
    code: doc.code ?? '',
    description: (doc.description ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    price: doc.price,
    isNew: doc.isNew ?? false,
    sizes: (doc.sizes ?? []).map((s) => s.size),
    soldOut: (doc.sizes ?? []).filter((s) => typeof s.stock === 'number' && s.stock <= 0).map((s) => s.size),
    stock: Object.fromEntries((doc.sizes ?? []).map((s) => [s.size, typeof s.stock === 'number' ? s.stock : null])),
    // Photos go through the shop's own /shop-img/ route (see pages/shop-img),
    // which fetches them from the admin with the key.
    photos: (doc.photos ?? []).flatMap((m) => (typeof m === 'object' && m?.filename ? [`/shop-img/${m.filename}`] : [])),
    cartClass: doc.cartClass ?? undefined,
});

// A few seconds of cache: plenty of visitors at a drop, the admin doesn't
// need to answer every single one. Stock is checked again at checkout.
let cache: { at: number; data: Catalog } | null = null;
const CACHE_MS = 10_000;

const EMPTY: Catalog = { products: [], zones: [] };

async function loadCatalog(): Promise<Catalog> {
    const [productsRes, settingsRes] = await Promise.all([backendFetch('/api/products?where[_status][equals]=published&depth=1&sort=order&limit=100'), backendFetch('/api/globals/shop-settings')]);
    if (!productsRes.ok || !settingsRes.ok) throw new Error(`Backend answered ${productsRes.status}/${settingsRes.status} (403 = wrong BACKEND_API_KEY)`);

    const products = ((await productsRes.json()).docs as PayloadProduct[]).map(toProduct);
    const settings = (await settingsRes.json()) as PayloadSettings;
    const zones = (settings.shippingZones ?? [])
        .map((z) => ({
            name: z.name ?? '',
            countries: (z.countries ?? '')
                .split(',')
                .map((c) => c.trim().toUpperCase())
                .filter(Boolean),
            price: z.price ?? 0,
        }))
        // A zone without countries can't be shipped to.
        .filter((z) => z.name && z.countries.length);

    return { products, zones };
}

/**
 * Never throws: if the admin can't be reached (or the key is wrong) the shop
 * shows the last catalogue it had, or an empty shop, instead of an error
 * page. The reason goes to the logs (Coolify → shop → Logs).
 */
export async function getCatalog(): Promise<Catalog> {
    if (!hasBackend()) return { products: localProducts, zones: [{ name: 'Nederland', countries: ['NL'], price: 0 }] };
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

    try {
        const data = await loadCatalog();
        cache = { at: Date.now(), data };
        return data;
    } catch (error) {
        console.error('[shop] could not load the catalogue from the admin:', error);
        return cache?.data ?? EMPTY;
    }
}

/** Fresh, uncached catalogue: used at checkout so prices and stock are current. Throws when the admin can't be reached. */
export async function getFreshCatalog(): Promise<Catalog> {
    if (!hasBackend()) return getCatalog();
    const data = await loadCatalog();
    cache = { at: Date.now(), data };
    return data;
}
