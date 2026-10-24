# southsidedinero shop

Webshop + label site for southsidedinero. Astro, set up the same way as
`winwinwin/libre-dash`: a node server (`@astrojs/node`), shipped with the
Dockerfile to Coolify.

## Start

```sh
npm install
npm run assets   # copies the radio art + beats over from ../../winwinwin/libre-dash/public
npm run dev      # http://localhost:4321
```

`npm run assets` only has to run again when beats or radio images change in
winwinwin. The copied files (`public/beats`, `public/img/*.png` outside
`public/img/shop`) are git-ignored, so the Docker build needs them present —
run it before building, or commit them if you'd rather.

## Where things live

| What | File |
| :-- | :-- |
| Products, stock, shipping zones | the admin (`../backend`), read by `src/lib/backend.server.ts` |
| Fallback products (no admin running) | `src/data/products.ts` |
| Checkout (makes the Stripe session) | `src/pages/api/checkout.ts` |
| Page after paying | `src/pages/bedankt.astro` |
| mama's tuin (tracks, video, cover, link) | `src/data/ep.ts` |
| Shop images, logos, badges | `public/img/shop/` |
| Page layout | `src/pages/index.astro` |
| Styles (SCSS, haazen-opzet) | `src/styles/` |
| Product popup | `src/components/ProductModal.astro` |
| Cart as receipt | `src/components/CartReceipt.astro` |
| Popup + cart logic | `src/lib/shop-client.ts` |
| Blue/white desktop + window manager | `src/components/DesktopSection.astro` |
| Window, Radio, RadioCard, beats loader | copied from libre-dash, unchanged apart from the storage key |

## Styles

Set up the same way as the LOEI themes (haazen): one entry file
`src/styles/style.scss` that `@forward`s partials, imported once in
`src/layouts/Base.astro`.

- `utils/_variables.scss` — fonts and colours (`$black`, `$pink`, `$green`…)
- `bootstrap/_bootstrap.scss` — `.container` / `.row` / `.col-*` grid
- `layout/_general.scss`, `layout/_buttons.scss` — base styles, `.button` + modifiers (`yellow`, `pink`, `grey`, `text`)
- `globals/_header.scss`, `globals/_footer.scss`
- `blocks/_<name>.scss` — one per block, classes as `.block-<name>-<element>`, media queries at the bottom

Radio, RadioCard and Window keep their own scoped styles, as copied from
libre-dash.

Formatting follows the shared `.prettierrc` (4 spaces, single quotes):
`npm run format`.

## Adding a product

In the admin (`admin.southsidedinero.com`, see `../backend/README.md`):
Producten → nieuw, fill it in, upload photos (first one is the card image),
sizes with their stock, then **Publiceren**. The shop shows it within ten
seconds. Saved as a draft it stays hidden. Untick the yellow "new" label once it isn't
new any more: the card then shows the red southsidedinero tag.

Without `BACKEND_ENDPOINT` (local dev without the admin) the shop shows the
products in `src/data/products.ts` instead, and checkout uses one zone,
Nederland, free shipping.

## Texts

The texts on the page are edited in the admin under **Website → Teksten**, one
tab per block. A field left empty shows the standard text (greyed out in the
field), which lives in `src/lib/content.server.ts`. Changes show up within ten
seconds. A new text block on the page: add the field in
`backend/src/globals/SiteContent.ts` and its standard text in
`content.server.ts`, then use it in the page.

## Checkout (Stripe)

The receipt's checkout button posts the cart to `/api/checkout`. That checks
prices, sizes and stock again in the admin, then makes a Stripe Checkout
session and sends the buyer there. Stripe asks for the address (only countries
in the chosen zone), adds that zone's shipping, takes iDEAL/Bancontact/cards
and mails a receipt. Afterwards the buyer lands on `/bedankt`.

Stripe then calls the admin's webhook, which saves the order (Bestellingen) and
lowers the stock. Orders are only made there, never by the shop itself.

Environment variables for the shop (Coolify):

| Variable | What |
| :-- | :-- |
| `BACKEND_ENDPOINT` | the admin's URL, `https://admin.southsidedinero.com` |
| `BACKEND_API_KEY` | API key of the "shop" user in the admin |
| `STRIPE_SECRET_KEY` | `sk_test_…` while testing, `sk_live_…` for real |
| `SITE_URL` | optional; where Stripe sends buyers back. Defaults to `https://southsidedinero.com` |

## The video clip

The hoorikvaak clip plays from YouTube (`youtubeId` in `src/data/ep.ts`), so
plays on the site count as views on the channel. The player only loads after a
click; until then it's just the YouTube thumbnail. Set `youtubeId` to `null`
to fall back to a file in `public/video/` via `video`.

## mama's tuin audio

The tracklist plays from `public/mamastuin/*.mp3` (192 kbps, made from the
.wav masters in the same folder). The .wavs stay out of git and Docker — ~110 MB
the visitor would never need. New master? Re-export, e.g.
`ffmpeg -i "track.wav" -b:a 192k "track.mp3"`, and update `src/data/ep.ts`.
The EP player and the radio pause each other, so only one plays at a time.

## The vault

The "kloesoe" window on the desktop opens with a 4-digit code. The code is
checked server-side by `src/pages/api/vault.ts`; `src/lib/vault.server.ts` holds
only its sha256 and the contents, and is never imported by a page, so neither
shows up in the browser. Change the code with the `VAULT_PIN` env var (Coolify)
or a new hash: `printf 1234 | sha256sum`. Five wrong tries locks a visitor out
for a minute. Edit `vaultContents` for what's inside; files linked from there
must not live in `public/`, or they're reachable without the code.

## Locked until the drop

Before a drop the site shows a log-in screen (the blue desktop with a
"Log in bij southsidedinero" dialog) instead of the shop. The radio, mama's
tuin, southsidedinero and the kloesoe still work behind it; the products are not
rendered at all. After logging in a cookie keeps the visitor in for 60 days and
they see the whole shop.

- `src/lib/lock.server.ts` decides: locked by default, password checked on the
  server, wrong guesses rate limited.
- `src/middleware.ts` sets `Astro.locals.locked` per request; `index.astro`
  leaves out everything product-related when it's true.
- Product photos live in `private/products/` and are served by `/shop-img/`,
  which answers 404 while the visitor is locked out.

Set in Coolify (no code change needed):

- `SITE_PASSWORD` the password. The default (`nulnanul`) is only for local
  testing, so set this before going live. Changing it logs everyone out.
- `SITE_LOCKED=false` on drop day opens the shop for everyone.

## Mailing list

The login screen has a second form: visitors without the password can leave
their email to hear about the drop. Addresses go to `data/subscribers.csv`
(`src/lib/subscribers.server.ts`, posted to `src/pages/api/subscribe.ts`).

On Coolify:

- Persistent Storage: a volume mounted at `/app/data`, otherwise the list is
  emptied on every deploy.
- `SUBSCRIBERS_PASSWORD`: the password to download the list. Open
  `https://southsidedinero.com/api/subscribers`, any username, this password,
  and you get a CSV. Without the variable that page answers 404.

Someone asking to be removed: delete their line from the CSV (Coolify
Terminal) until the list moves into Payload.

## Still open

- **Beats**: selling beats (download after paying) is for later, through the
  same admin and Stripe setup.
- **Copy**: hero text and the Roermond story are still placeholders in
  `src/pages/index.astro`.
- **Footer links**: service/legal pages don't exist yet.
