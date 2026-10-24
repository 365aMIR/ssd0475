import type { APIRoute } from 'astro';
import { addSubscriber, isEmail, tooMany } from '../../lib/subscribers.server';

export const prerender = false;

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

    await addSubscriber(email);
    // Same answer for new and known addresses, so the form can't be used to
    // check who is on the list.
    return redirect('/?mail=ok', 303);
};
