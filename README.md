# Map Poster Studio

Browser-based map poster generator inspired by [originalankur/maptoposter](https://github.com/originalankur/maptoposter). Renders entirely client-side and deploys to Cloudflare Pages.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI components
- MapLibre GL + OpenFreeMap vector tiles
- Nominatim geocoding (proxied)
- Vector SVG export rasterized to PNG at 300 DPI

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Cloudflare (Workers Builds)

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Static assets: `dist/` (via `wrangler.toml` `[assets]`)
- API routes: compiled from `functions/` (`/api/geocode`, `/api/boundary`)
- Wrangler config: `wrangler.toml`

### KV setup (edge geocode cache)

1. Create a KV namespace:

```bash
npx wrangler kv namespace create PROXY_CACHE
```

2. Copy the returned namespace `id` into `wrangler.toml` under `[[kv_namespaces]]`.
3. Redeploy the Pages project (or bind the namespace in the Cloudflare dashboard under **Settings → Bindings**).

The geocode proxy caches successful Nominatim responses in KV for 30 days (`X-Cache: HIT|MISS` response header). This does **not** reduce Pages Function invocations — it reduces upstream Nominatim traffic. Returning users with browser geocode cache may skip `/api/geocode` entirely.

Local `npm run dev` simulates the same KV behaviour with an in-memory cache in `vite.dev-proxy.ts`.

## Features

- 17 ported themes from upstream JSON
- City/country geocoding with manual coordinate override
- Radius control, display labels, Google Fonts family
- Export presets (Instagram, A4, 4K, default poster)
- Shareable URL state + local autosave
- Theme JSON editor
- Live MapLibre preview (pan/zoom, no Generate button)
- Fine-grained layer toggles (water, roads, buildings, rail, ship routes)
- Optional city boundary mask (place admin polygon)
- Vector SVG + PNG export; batch all-themes ZIP (PNG + SVG per theme)

## Self-hosting (Docker)

Map Poster Studio can run as a static app with geocode/boundary proxies — similar to other self-hosted map poster tools.

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:7200` (override with `APP_PORT`).

Set `GEOCODE_CONTACT_EMAIL` for Nominatim policy compliance.

Cloudflare Pages remains the primary deploy path for this repo (MIT license, lightweight edge functions + KV cache).

## License

MIT
