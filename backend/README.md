# southsidedinero admin

Payload CMS, set up like flipmerktop's backend: Next.js, MongoDB, photos in the
Seaweed bucket. It holds the products, stock, shipping zones and orders. The
shop (`../shop`) reads from it with an API key, and Stripe tells it when
something is paid.

Everything here is private: without logging in (or the shop's API key) the
API answers 403. That way unreleased products and photos can't leak before a
drop.

## Start

```sh
npm install --legacy-peer-deps
cp .env.example .env   # fill in DATABASE_URI and PAYLOAD_SECRET at least
npm run dev            # http://localhost:3000/admin
```

The first visit asks you to make the first user.

## What's in it

| Admin | What | File |
| :-- | :-- | :-- |
| Producten | name, slug, price (€ incl. btw), photos, sizes with stock, drafts | `src/collections/Products.ts` |
| Bestellingen | made by Stripe's webhook, never by hand | `src/collections/Orders.ts` |
| Foto's | product photos | `src/collections/Media.ts` |
| Gebruikers | people who log in, plus the "shop" user with an API key | `src/collections/Users.ts` |
| Shop instellingen | shipping zones (name, countries, price) | `src/globals/ShopSettings.ts` |
| Teksten | the texts on the site, one tab per block (hero, winkel, mama's tuin, footer, login screen, thank-you page…) | `src/globals/SiteContent.ts` |
| | Stripe webhook, `POST /api/stripe-webhook` | `src/stripe/webhook.ts` |

Stock: empty means not counted (never sells out). A number goes down with every
paid order and the size shows as sold out at 0.

Shipping zones: countries are two-letter codes, comma separated, e.g.
`NL` or `BE, DE, FR, LU, AT`. Stripe only accepts addresses in the zone's
countries.

Orders: set the status to "Verzonden" and fill in the track & trace once it's
posted. (The buyer isn't mailed about that automatically yet.)

## Coolify

1. **MongoDB**: new resource → Database → MongoDB. Copy its internal URL.
2. **Admin**: new resource → this repo, Build Pack Dockerfile, Base Directory
   `/backend`, port `3000`, domain `https://admin.southsidedinero.com`
   (the `*` DNS record already points there). Environment variables:

   | Variable | Value |
   | :-- | :-- |
   | `DATABASE_URI` | the Mongo internal URL from step 1 |
   | `PAYLOAD_SECRET` | a long random string |
   | `SEAWEED_ENDPOINT`, `SEAWEED_ACCESS_KEY`, `SEAWEED_SECRET_KEY`, `SEAWEED_BUCKET_NAME` | as for flipmerktop, with a new bucket |
   | `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` from step 4 |

3. **Shop user**: in the admin, Gebruikers → nieuw, e.g. `shop@southsidedinero.com`,
   tick "Enable API key", save, copy the key. That goes in the shop's
   `BACKEND_API_KEY`.
4. **Stripe**: Developers → Webhooks → add endpoint
   `https://admin.southsidedinero.com/api/stripe-webhook`, events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Its signing secret is `STRIPE_WEBHOOK_SECRET`. Do this once in test mode and
   once in live mode (they have different keys and secrets).

Without the Seaweed variables, uploads are stored on disk in `./media` (fine
locally, lost on every deploy on Coolify).
