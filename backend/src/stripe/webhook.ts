import type { Endpoint, Payload } from 'payload';
import Stripe from 'stripe';

/**
 * POST /api/stripe-webhook
 *
 * Stripe calls this after a checkout. A paid session becomes an order in the
 * admin and lowers the stock of the sizes that were bought.
 *
 * In the Stripe dashboard: Developers → Webhooks → add endpoint
 * https://admin.southsidedinero.com/api/stripe-webhook with the events
 * checkout.session.completed and checkout.session.async_payment_succeeded,
 * and put its signing secret in STRIPE_WEBHOOK_SECRET.
 */

/** What the shop puts in the session's metadata: [{ p: product slug, s: size, q: quantity }]. */
type MetaLine = { p: string; s: string; q: number };

const toEuro = (cents: number | null | undefined) => Math.round(cents ?? 0) / 100;

export async function createOrderFromSession(payload: Payload, session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') return 'not paid yet';

    // Stripe can send the same event twice; one order per session.
    const existing = await payload.find({
        collection: 'orders',
        where: { stripeSessionId: { equals: session.id } },
        limit: 1,
        overrideAccess: true,
    });
    if (existing.docs.length) return 'already recorded';

    let lines: MetaLine[] = [];
    try {
        lines = JSON.parse(session.metadata?.items ?? '[]');
    } catch {
        lines = [];
    }

    const items = [];
    for (const line of lines) {
        const found = await payload.find({
            collection: 'products',
            where: { slug: { equals: line.p } },
            limit: 1,
            overrideAccess: true,
        });
        const product = found.docs[0];
        items.push({
            product: product?.id,
            name: product?.name ?? line.p,
            size: line.s,
            quantity: line.q,
            unitPrice: product?.price ?? 0,
        });

        // Lower the stock of that size, when it is being tracked.
        if (product?.sizes?.some((s) => s.size === line.s && typeof s.stock === 'number')) {
            await payload.update({
                collection: 'products',
                id: product.id,
                overrideAccess: true,
                data: {
                    sizes: product.sizes.map((s) => (s.size === line.s && typeof s.stock === 'number' ? { ...s, stock: Math.max(0, s.stock - line.q) } : s)),
                },
            });
        }
    }

    // Newer Stripe API versions put the shipping address under collected_information.
    const shipping = session.collected_information?.shipping_details ?? (session as unknown as { shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails }).shipping_details;
    const address = shipping?.address ?? session.customer_details?.address;

    await payload.create({
        collection: 'orders',
        overrideAccess: true,
        data: {
            status: 'paid',
            name: shipping?.name ?? session.customer_details?.name ?? '',
            email: session.customer_details?.email ?? '',
            phone: session.customer_details?.phone ?? '',
            address: {
                line1: address?.line1 ?? '',
                line2: address?.line2 ?? '',
                postalCode: address?.postal_code ?? '',
                city: address?.city ?? '',
                country: address?.country ?? '',
            },
            items,
            shippingMethod: session.metadata?.zone ?? '',
            shippingCost: toEuro(session.shipping_cost?.amount_total),
            total: toEuro(session.amount_total),
            stripeSessionId: session.id,
            stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? ''),
        },
    });
    return 'order created';
}

export const stripeWebhook: Endpoint = {
    path: '/stripe-webhook',
    method: 'post',
    handler: async (req) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const key = process.env.STRIPE_SECRET_KEY;
        if (!secret || !key) return Response.json({ error: 'Stripe not configured' }, { status: 500 });

        const signature = req.headers.get('stripe-signature') ?? '';
        const body = req.text ? await req.text() : '';

        let event: Stripe.Event;
        try {
            event = new Stripe(key).webhooks.constructEvent(body, signature, secret);
        } catch {
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            const result = await createOrderFromSession(req.payload, event.data.object);
            req.payload.logger.info(`Stripe ${event.type} ${event.data.object.id}: ${result}`);
        }

        return Response.json({ received: true });
    },
};
