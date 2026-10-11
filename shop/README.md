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
| Products (name, price, sizes, photos, new tag) | `src/data/products.ts` |
| Shipping cost on the receipt | `SHIPPING` in `src/data/products.ts` |
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

Add an entry to `products` in `src/data/products.ts` and drop its photos in
`public/img/shop/`. First photo is the card image. Set `isNew: false` once it's
no longer new — the card then shows the red southsidedinero tag.

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

The "kluis" window on the desktop opens with a 4-digit code. The code is
checked server-side by `src/pages/api/vault.ts`; `src/lib/vault.server.ts` holds
only its sha256 and the contents, and is never imported by a page, so neither
shows up in the browser. Change the code with the `VAULT_PIN` env var (Coolify)
or a new hash: `printf 1234 | sha256sum`. Five wrong tries locks a visitor out
for a minute. Edit `vaultContents` for what's inside; files linked from there
must not live in `public/`, or they're reachable without the code.

## Still open

- **Checkout**: the receipt's checkout button is disabled. Needs a payment
  provider (Mollie, Stripe, Shopify buy button…) before it can take orders.
- **Shipping cost**: `SHIPPING` is `null`, so the receipt shows "nog te bepalen".
- **Copy**: hero text and the Roermond story are still placeholders in
  `src/pages/index.astro`.
- **Footer links**: service/legal pages don't exist yet.
