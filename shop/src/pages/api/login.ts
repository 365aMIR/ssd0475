import type { APIRoute } from 'astro';
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessToken, checkPassword, clearMisses, registerMiss, waitFor } from '../../lib/lock.server';

export const prerender = false;

// The login screen's form posts here. A plain form, so it works without
// JavaScript: right password sets the cookie and goes back to the shop, wrong
// one goes back with ?login=fout (or ?login=wacht after too many tries).
export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
    // Behind Coolify's proxy the real visitor is the first forwarded address.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress;

    if (waitFor(ip)) return redirect('/?login=wacht', 303);

    const form = await request.formData();
    const password = String(form.get('password') ?? '');

    if (!password || !checkPassword(password)) {
        registerMiss(ip);
        return redirect(waitFor(ip) ? '/?login=wacht' : '/?login=fout', 303);
    }

    clearMisses(ip);
    cookies.set(ACCESS_COOKIE, accessToken(), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        maxAge: ACCESS_MAX_AGE,
    });
    return redirect('/', 303);
};
