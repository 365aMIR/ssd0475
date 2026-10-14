import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

// Product photos live in private/products/ instead of public/, so they can't
// be opened before the drop by guessing the file name. Logged-in visitors (and
// everyone once the site is unlocked) get them from here.
const DIR = path.join(process.cwd(), 'private', 'products');
const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export const GET: APIRoute = async ({ params, locals }) => {
    if (locals.locked) return new Response('Not found', { status: 404 });

    const file = params.file ?? '';
    const type = TYPES[path.extname(file).toLowerCase()];
    // Plain file names only, nothing that could climb out of the folder.
    if (!type || !/^[a-z0-9_-]+\.[a-z]+$/i.test(file)) return new Response('Not found', { status: 404 });

    try {
        const body = await fs.readFile(path.join(DIR, file));
        return new Response(body, {
            headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' },
        });
    } catch {
        return new Response('Not found', { status: 404 });
    }
};
