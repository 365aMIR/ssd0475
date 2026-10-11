// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Same setup as winwinwin/libre-dash: a node server, so the radio can read the
// beats folder at request time and Coolify can run it from the Dockerfile.
export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
});
