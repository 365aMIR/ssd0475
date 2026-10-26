# Pinned to the version package.json's engines field requires.
FROM node:22.12-alpine AS build
WORKDIR /app
# The server's connection to the npm registry is flaky: retry slowly, fewer
# downloads at once, and no audit/fund calls.
ENV NPM_CONFIG_FETCH_RETRIES=6 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_MAXSOCKETS=4 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
# Up to three tries if npm still gives up halfway.
RUN n=0; until npm ci; do n=$((n+1)); [ "$n" -ge 3 ] && exit 1; echo "npm ci failed, retry $n"; sleep 15; done
COPY . .
RUN npm run build
# Drop the build tools; the runtime copies what's left instead of downloading again.
RUN npm prune --omit=dev

FROM node:22.12-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Product photos, served by /shop-img/ only to visitors who may see them.
COPY --from=build /app/private ./private

# The node adapter binds to localhost unless told otherwise, which the Coolify
# proxy cannot reach.
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
# Fallback for the mailing list when the admin can't be reached
# (lib/subscribers.server.ts); normally addresses go to the admin.
RUN mkdir -p /app/data && chown node:node /app/data
USER node
CMD ["node", "./dist/server/entry.mjs"]
