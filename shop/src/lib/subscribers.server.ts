import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * The mailing list from the login screen: people who leave their address to
 * hear about the drop. Server only.
 *
 * Stored as one CSV file in DATA_DIR (default ./data). On Coolify that folder
 * must be a Persistent Storage volume mounted at /app/data, otherwise every
 * deploy starts with an empty list. When the Payload backend is live, this
 * moves into a collection there.
 */
const DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DIR, 'subscribers.csv');
const HEADER = 'email,date\n';

/** Loose on purpose: enough to catch typos, not to reject real addresses. */
export const isEmail = (value: string) => value.length <= 254 && /^[^\s@,;"]+@[^\s@,;"]+\.[^\s@,;"]+$/.test(value);

async function read(): Promise<string> {
    try {
        return await fs.readFile(FILE, 'utf8');
    } catch {
        return HEADER;
    }
}

/** Adds the address; returns false when it was already on the list. */
export async function addSubscriber(email: string): Promise<boolean> {
    const address = email.trim().toLowerCase();
    const current = await read();
    const known = current.split('\n').some((line) => line.split(',')[0] === address);
    if (known) return false;

    await fs.mkdir(DIR, { recursive: true });
    const prefix = current === HEADER ? HEADER : '';
    if (prefix) await fs.writeFile(FILE, prefix);
    await fs.appendFile(FILE, `${address},${new Date().toISOString()}\n`);
    return true;
}

export const readSubscribers = read;

/**
 * Wrong guesses on the export and too many sign-ups from one visitor are
 * rate limited, like the login.
 */
const MAX_TRIES = 5;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; since: number }>();

export function tooMany(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.since > WINDOW_MS) {
        hits.set(key, { count: 1, since: now });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_TRIES;
}
