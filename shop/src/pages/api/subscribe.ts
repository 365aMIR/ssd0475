import type { APIRoute } from 'astro';
import { backendFetch, hasBackend } from '../../lib/backend.server';
import { addSubscriber, isEmail, tooMany } from '../../lib/subscribers.server';

export const prerender = false;

/**
 * Saves the address in the admin (Website → Inschrijvingen). Already on the
 * list counts as done. If the admin can't be reached, the address goes to the
 * local file instead (lib/subscribers.server.ts), so nobody is lost.
 */
async function save(email: string) {
    if (hasBackend()) {
        try {
            const res = await backendFetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            // 400 = already on the list (the address is unique in the admin).
            if (res.ok || res.status === 400) return;
            throw new Error(`Backend answered ${res.status}`);
        } catch (error) {
            console.error('[subscribe] admin unreachable, saving to the local file:', error);
        }
    }
    await addSubscriber(email);
}

// The mail form on the login screen posts here. A plain form like the login:
// it goes back to the page with ?mail=ok, ?mail=fout or ?mail=wacht.
export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress;
    if (tooMany(`subscribe:${ip}`)) return redirect('/?mail=wacht', 303);

    const form = await request.formData();
    // Bots fill in every field; people never see this one.
    if (String(form.get('website') ?? '')) return redirect('/?mail=ok', 303);

    const email = String(form.get('email') ?? '').trim();
    if (!isEmail(email)) return redirect('/?mail=fout', 303);

    await save(email);
    // Same answer for new and known addresses, so the form can't be used to
    // check who is on the list.
    return redirect('/?mail=ok', 303);
};
