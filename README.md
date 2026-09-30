# storefront-homeware

The `homeware` storefront template: a warm cream look in Libre Caslon and
Albert Sans for furniture, kitchen and home-decor shops, with Indonesian copy,
built for any shop that picks it. Everything that is not a design — API
client, tenant config, cart, checkout state, the helpers that decide what a
page may say — comes from
[`@sepetakhq/storefront-kit`](https://www.npmjs.com/package/@sepetakhq/storefront-kit).
Forked from `storefront-bakery`, so checkout, the order page and every payment
panel behave the same.

Nothing about a merchant is in here. Name, nav, hero, features, categories,
campaign, story, contact, payment methods and couriers all arrive from
`/storefront/config` and `/storefront/home`. A product or category without a
picture renders as a two-letter tile, and an empty hero slot as a line lamp.

## Develop

Run the platform API first (`make up && make seed && make api` in the
`lilyalora` checkout; the seed installs the *Home&Kitchen Finds* demo tenant
on this template), then:

```
npm install
npm run dev          # http://homeware.localhost:5187, /api proxied to the API on :8090
```

Open it on `homeware.localhost`, not `localhost`: the API resolves the shop
from the Host header. `API_TARGET` and `DEV_PORT` override the proxy target
and port.

## Ship

`public/manifest.json` and `public/preview.jpg` are this template's catalogue
entry; `src/manifest.test.js` refuses a push without them. Every push to
`main` builds and uploads to the template registry
(`.github/workflows/release.yml`). To see the registry path locally:

```
npm run publish:local
open http://homeware.localhost:8090/
```

(The dev MinIO must list `http://homeware.localhost:8090` in
`MINIO_API_CORS_ALLOW_ORIGIN`, and its container must have been recreated
since, or the page is blank.)

## Rules

- Serve exactly the kit's `ROUTE_CONTRACT` (`src/routes.test.js` pins it).
  The design's shop and collections pages are `/katalog` (`?cat=`,
  `?sale=1`), and its contact page is part of `/tentang`: the platform has
  one page for both.
- Keep the `<!--seo:start-->` / `<!--seo:end-->` markers in `index.html`.
- Every colour is a `--hw-*` token in `src/styles.css`; no colour literal,
  demo-shop string or undefined token anywhere else. `src/no-hardcode.test.js`
  enforces all three.
- Branch on `payment.kind`, render `order.timeline` and `status_label`.
- Draw what the backend sends, as sent. Every label a merchant might change
  is a `section_copy` key read through `sectionText`, and `DEFAULT_LABELS` is
  only the fallback for a blank one. A feature `mark` shows exactly as typed,
  and variant values are words, never colour swatches: the design's
  icon-name and colour-name tables were dropped on purpose. Never add a table
  that turns merchant input into something else, and never add to the kit for
  this template's sake (rule 11 in the platform's CLAUDE.md).
- No wishlist (the platform has none) and no embedded map: the address links
  out to Google Maps.
- The API's `bg` is a name, `butter` or `pink` (`bannerTheme`); `hero.em` is
  text after the title.
- The template's own decisions live in `src/lib/copy.js` as pure functions
  with tests.
