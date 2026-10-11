import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * The vault on the desktop. Server only: nothing in this file is imported by a
 * page or a client script, so neither the pin nor what's inside ever reaches
 * the browser until the right code has been punched in.
 *
 * The pin itself isn't written here either, only its sha256. Set VAULT_PIN in
 * Coolify to change it without touching the code.
 */
const PIN_HASH = '982d3994761cb91e24a4ee16f54db6e5df4d66e9f0c97a4996e59d738810d38e';

/** What's behind the door. Swap the placeholders for the real thing. */
export const vaultContents = {
    title: 'kluis',
    note: '[Wat zit er in de kluis? Bijvoorbeeld een unreleased track, een kortingscode of een eerste blik op drop_002.]',
    items: [] as { label: string; href: string }[],
};

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export function checkPin(pin: string): boolean {
    const expected = process.env.VAULT_PIN ? sha256(process.env.VAULT_PIN) : Buffer.from(PIN_HASH, 'hex');
    return timingSafeEqual(sha256(pin), expected);
}

/**
 * Four digits is only 10,000 options, so wrong guesses are rate limited per
 * visitor: after MAX_TRIES the vault stays shut for LOCK_MS.
 */
const MAX_TRIES = 5;
const LOCK_MS = 60_000;
const tries = new Map<string, { count: number; until: number }>();

/** Milliseconds this visitor still has to wait, 0 when they may try. */
export function lockedFor(ip: string): number {
    const entry = tries.get(ip);
    if (!entry) return 0;
    const left = entry.until - Date.now();
    if (left > 0) return left;
    if (entry.until) tries.delete(ip);
    return 0;
}

export function registerMiss(ip: string): number {
    const entry = tries.get(ip) ?? { count: 0, until: 0 };
    entry.count += 1;
    if (entry.count >= MAX_TRIES) {
        entry.count = 0;
        entry.until = Date.now() + LOCK_MS;
    }
    tries.set(ip, entry);
    return MAX_TRIES - entry.count;
}

export function clearMisses(ip: string) {
    tries.delete(ip);
}
