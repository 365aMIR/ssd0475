import type { APIRoute } from 'astro';
import { checkPin, clearMisses, lockedFor, registerMiss, vaultContents } from '../../lib/vault.server';

export const prerender = false;

const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

// POST { pin } → the vault contents, or a miss. The pin is checked here so the
// browser never gets to see it.
export const POST: APIRoute = async ({ request, clientAddress }) => {
    // Behind Coolify's proxy the real visitor is the first forwarded address.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress;

    const wait = lockedFor(ip);
    if (wait) return json({ ok: false, locked: Math.ceil(wait / 1000) }, 429);

    let pin = '';
    try {
        pin = String((await request.json()).pin ?? '');
    } catch {
        return json({ ok: false }, 400);
    }

    if (!/^\d{4}$/.test(pin) || !checkPin(pin)) {
        const left = registerMiss(ip);
        const locked = lockedFor(ip);
        return json({ ok: false, left, locked: locked ? Math.ceil(locked / 1000) : 0 }, 401);
    }

    clearMisses(ip);
    return json({ ok: true, vault: vaultContents });
};
