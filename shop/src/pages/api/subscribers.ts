import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { readSubscribers, tooMany } from '../../lib/subscribers.server';

export const prerender = false;

// Download the mailing list: open /api/subscribers in the browser, it asks for
// a password (the username can be anything). The password is the
// SUBSCRIBERS_PASSWORD environment variable; without it this page doesn't exist.
export const GET: APIRoute = async ({ request, clientAddress }) => {
    const secret = process.env.SUBSCRIBERS_PASSWORD;
    if (!secret) return new Response('Not found', { status: 404 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress;
    const auth = request.headers.get('authorization') ?? '';
    const given = auth.startsWith('Basic ') ? Buffer.from(auth.slice(6), 'base64').toString().split(':').slice(1).join(':') : '';
    const ok = given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));

    if (!ok) {
        if (given && tooMany(`export:${ip}`)) return new Response('Too many tries', { status: 429 });
        return new Response('Login required', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="southsidedinero mailing list"' },
        });
    }

    return new Response(await readSubscribers(), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="southsidedinero-mailinglist.csv"',
            'Cache-Control': 'no-store',
        },
    });
};
