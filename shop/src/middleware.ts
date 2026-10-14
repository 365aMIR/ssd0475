import { defineMiddleware } from 'astro:middleware';
import { ACCESS_COOKIE, lockedFor } from './lib/lock.server';

// Decides per request whether this visitor gets the login screen
// (see lib/lock.server.ts). index.astro and the product image route read it.
export const onRequest = defineMiddleware((context, next) => {
    context.locals.locked = lockedFor(context.cookies.get(ACCESS_COOKIE)?.value);
    return next();
});
