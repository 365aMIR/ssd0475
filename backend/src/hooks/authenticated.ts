import type { Access } from 'payload';

/**
 * Everything in this admin is private: only logged-in users (you in the admin,
 * the shop with its API key) can read it. Nothing about the products is public
 * before the drop; the shop decides what visitors see.
 */
export const authenticated: Access = ({ req: { user } }) => {
    return Boolean(user);
};
