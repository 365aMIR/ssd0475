import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { backendFetch, hasBackend } from '../../lib/backend.server';

export const prerender = false;

// Product photos. They are private in the Payload admin, so the shop fetches
// them there with its API key and passes them on, but only to visitors who
// may see the shop (not while it's locked for them). Without the admin, the
// files come from private/products/.
const DIR = path.join(process.cwd(), 'private', 'products');
const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' };

export const GET: APIRoute = async ({ params, locals }) => {
    if (locals.locked) return new Response('Not found', { status: 404 });

    const file = params.file ?? '';
    const type = TYPES[path.extname(file).toLowerCase()];
    // Plain file names only, nothing that could climb out of the folder.
    if (!type || !/^[a-z0-9_.-]+\.[a-z]+$/i.test(file) || file.includes('..')) return new Response('Not found', { status: 404 });

    const headers = { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' };

    if (hasBackend()) {
        const res = await backendFetch(`/api/media/file/${encodeURIComponent(file)}`);
        if (!res.ok || !res.body) return new Response('Not found', { status: 404 });
        return new Response(res.body, { headers });
    }

    try {
        return new Response(await fs.readFile(path.join(DIR, file)), { headers });
    } catch {
        return new Response('Not found', { status: 404 });
    }
};
