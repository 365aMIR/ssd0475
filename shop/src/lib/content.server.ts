import { backendFetch, hasBackend } from './backend.server';

/**
 * The texts on the site, edited in the admin under Website → Teksten
 * (backend/src/globals/SiteContent.ts). Every field left empty there falls
 * back to the text below, so these are also the texts without the admin.
 */
export const DEFAULT_CONTENT = {
    hero: {
        annotation: 'NULNANUL',
        title: 'drop_001',
        intro: '',
        button: 'get fly →',
        epLink: "mama's tuin →",
        windowTitle: 'rojo_angelo.jpg',
    },
    shop: {
        title: 'winkel',
    },
    drop: {
        windowTitle: 'drop_001',
        path: 'c:\\southsidedinero\\drop_001',
    },
    ep: {
        annotation: 'ep · southsidedinero',
        title: "mama's tuin",
        artist: 'su00ki',
        year: '2026',
        summary: '5 songs, 9 min 27 sec',
        released: '18 september 2026',
        listenLabel: 'luister op spotify →',
        youtubeLabel: 'bekijk op youtube →',
    },
    about: {
        windowTitle: 'southsidedinero',
        title: 'roertje',
        content: 'enne',
    },
    locked: {
        desktopText: 'drop_001 soon come soon come',
        loginText: 'holdonnnn',
    },
    footer: {
        copyright: '© southsidedinero 2026',
        links: [
            { label: 'Algemene voorwaarden', url: '#' },
            { label: 'Privacy', url: '#' },
        ],
    },
    thanks: {
        paidTitle: 'bedankt',
        paidText: 'je bestelling is binnen. de bevestiging staat in je mail, we laten het weten zodra hij onderweg is.',
        pendingTitle: 'bijna.',
        pendingText: 'we zien je betaling nog niet. betaalde je met een methode die wat langer duurt, dan krijg je een mail zodra hij rond is.',
    },
};

export type SiteContent = typeof DEFAULT_CONTENT;

/** Splits a textarea into paragraphs: one per non-empty line. */
export const paragraphs = (value: string) =>
    value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

type Raw = Record<string, Record<string, unknown> | undefined>;

// Fills every empty field from DEFAULT_CONTENT, block by block.
function merge(raw: Raw): SiteContent {
    const out = structuredClone(DEFAULT_CONTENT) as Record<string, Record<string, unknown>>;
    for (const [block, fields] of Object.entries(out)) {
        const saved = raw[block];
        if (!saved) continue;
        for (const key of Object.keys(fields)) {
            const value = saved[key];
            if (Array.isArray(value)) {
                const rows = value.filter((row) => row && typeof row.label === 'string' && row.label.trim());
                if (rows.length) fields[key] = rows.map((row) => ({ label: row.label, url: row.url || '#' }));
            } else if (typeof value === 'string' && value.trim()) {
                fields[key] = value.trim();
            }
        }
    }
    return out as SiteContent;
}

let cache: { at: number; data: SiteContent } | null = null;
const CACHE_MS = 10_000;

/** Never throws: without the admin (or when it's down) the standard texts are used. */
export async function getContent(): Promise<SiteContent> {
    if (!hasBackend()) return DEFAULT_CONTENT;
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

    try {
        const res = await backendFetch('/api/globals/site-content?depth=0');
        if (!res.ok) throw new Error(`Backend answered ${res.status}`);
        const data = merge((await res.json()) as Raw);
        cache = { at: Date.now(), data };
        return data;
    } catch (error) {
        console.error('[shop] could not load the texts from the admin:', error);
        return cache?.data ?? DEFAULT_CONTENT;
    }
}
