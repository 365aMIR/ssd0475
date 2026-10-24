import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getFreshCatalog } from '../../lib/backend.server';

export const prerender = false;

// The receipt's checkout button posts the cart here. Prices, sizes and stock
// are looked up again in the admin (never trusted from the browser), then a
// Stripe Checkout session is made and its URL sent back. Stripe's page asks
// for the address (only in the chosen zone's countries), adds the zone's
// shipping price, takes iDEAL/cards and mails the receipt. After paying, the
// webhook in the admin turns it into an order (backend/src/stripe/webhook.ts).

interface Line {
    id: string;
    size: string;
    qty: number;
}

const fail = (message: string, status = 400) => Response.json({ error: message }, { status });

export const POST: APIRoute = async ({ request, locals, url }) => {
    if (locals.locked) return fail('De shop is nog op slot.', 403);

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return fail('Betalen is nog niet ingesteld.', 503);

    let body: { lines?: Line[]; zone?: number };
    try {
        body = await request.json();
    } catch {
        return fail('Ongeldige bestelling.');
    }

    const lines = (body.lines ?? []).filter((l) => l && typeof l.id === 'string' && typeof l.size === 'string' && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 10);
    if (!lines.length) return fail('Je bonnetje is leeg.');

    let catalog;
    try {
        catalog = await getFreshCatalog();
    } catch (error) {
        console.error('[checkout] could not load the catalogue from the admin:', error);
        return fail('De shop is even niet bereikbaar, probeer het zo nog eens.', 503);
    }
    const { products, zones } = catalog;
    const zone = zones[body.zone ?? -1];
    if (!zone) return fail('Kies waar je bestelling heen moet.');

    const items = [];
    for (const line of lines) {
        const product = products.find((p) => p.id === line.id);
        if (!product || !product.sizes.includes(line.size)) return fail('Een product op je bonnetje is niet meer te koop.');
        const stock = product.stock?.[line.size];
        if (typeof stock === 'number' && stock < line.qty) return fail(stock > 0 ? `Nog maar ${stock} over van ${product.name} in ${line.size}.` : `${product.name} in ${line.size} is uitverkocht.`);
        items.push({ product, line });
    }

    // Stripe metadata values are limited to 500 characters.
    const meta = JSON.stringify(items.map(({ line }) => ({ p: line.id, s: line.size, q: line.qty })));
    if (meta.length > 500) return fail('Te veel verschillende producten in één keer.');

    // Where Stripe sends buyers back. Behind Coolify's proxy the request URL
    // is the container's own address, so live it's the real domain (or
    // SITE_URL, e.g. for a staging copy).
    const origin = process.env.SITE_URL?.replace(/\/$/, '') || (import.meta.env.DEV ? url.origin : 'https://southsidedinero.com');
    const session = await new Stripe(key).checkout.sessions.create({
        mode: 'payment',
        locale: 'nl',
        line_items: items.map(({ product, line }) => ({
            quantity: line.qty,
            price_data: {
                currency: 'eur',
                unit_amount: Math.round(product.price * 100),
                product_data: { name: `${product.name} · ${line.size}` },
            },
        })),
        shipping_address_collection: {
            allowed_countries: zone.countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    display_name: zone.name,
                    fixed_amount: { amount: Math.round(zone.price * 100), currency: 'eur' },
                },
            },
        ],
        metadata: { items: meta, zone: zone.name },
        success_url: `${origin}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?checkout=geannuleerd`,
    });

    return Response.json({ url: session.url });
};
