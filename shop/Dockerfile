# Pinned to the version package.json's engines field requires.
FROM node:22.12-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.12-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Product photos, served by /shop-img/ only to visitors who may see them.
COPY --from=build /app/private ./private

# The node adapter binds to localhost unless told otherwise, which the Coolify
# proxy cannot reach.
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
# Mailing list from the login screen (lib/subscribers.server.ts). Mount a
# Coolify Persistent Storage volume here or the list is lost on every deploy.
RUN mkdir -p /app/data && chown node:node /app/data
USER node
CMD ["node", "./dist/server/entry.mjs"]
