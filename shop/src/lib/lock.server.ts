import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The lockout before a drop: visitors get the login screen instead of the shop
 * until they type the password. Once in, a cookie remembers them and they see
 * everything.
 *
 * Server only, like vault.server.ts: no page or client script imports it.
 *
 * Switch it with environment variables in Coolify, no code change needed:
 * - SITE_LOCKED=false   opens the shop for everyone (drop day)
 * - SITE_PASSWORD=...   the password; set this before going live, the
 *                       default below is only for testing locally
 * Changing the password also logs everyone out.
 */
const LOCKED_BY_DEFAULT = true;

/** sha256 of the testing password "nulnanul". */
const DEFAULT_PASSWORD_HASH = 'fd7a8d5691d4859861a6ddf9cf95cbabe069ca0c246765821e6c071d4e064d62';

export const ACCESS_COOKIE = 'ssd_access';
/** How long a login lasts: 60 days. */
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 60;

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export function isLocked(): boolean {
    const env = process.env.SITE_LOCKED;
    if (env === 'false') return false;
    if (env === 'true') return true;
    return LOCKED_BY_DEFAULT;
}

const passwordHash = () => (process.env.SITE_PASSWORD ? sha256(process.env.SITE_PASSWORD) : Buffer.from(DEFAULT_PASSWORD_HASH, 'hex'));

export function checkPassword(password: string): boolean {
    return timingSafeEqual(sha256(password), passwordHash());
}

/**
 * The cookie value: a signature over the current password, so it can't be
 * made up and stops working when the password changes.
 */
export function accessToken(): string {
    return createHmac('sha256', passwordHash()).update('ssd-access').digest('hex');
}

export function hasAccess(cookie: string | undefined): boolean {
    if (!cookie) return false;
    const expected = Buffer.from(accessToken());
    const given = Buffer.from(cookie);
    return given.length === expected.length && timingSafeEqual(given, expected);
}

/** True when this request should get the login screen. */
export const lockedFor = (cookie: string | undefined) => isLocked() && !hasAccess(cookie);

/**
 * Wrong guesses are rate limited per visitor, the same way as the kloesoe: after
 * MAX_TRIES the login stays shut for LOCK_MS.
 */
const MAX_TRIES = 5;
const LOCK_MS = 60_000;
const tries = new Map<string, { count: number; until: number }>();

export function waitFor(ip: string): number {
    const entry = tries.get(ip);
    if (!entry) return 0;
    const left = entry.until - Date.now();
    if (left > 0) return left;
    if (entry.until) tries.delete(ip);
    return 0;
}

export function registerMiss(ip: string) {
    const entry = tries.get(ip) ?? { count: 0, until: 0 };
    entry.count += 1;
    if (entry.count >= MAX_TRIES) {
        entry.count = 0;
        entry.until = Date.now() + LOCK_MS;
    }
    tries.set(ip, entry);
}

export function clearMisses(ip: string) {
    tries.delete(ip);
}
