# Map Poster Studio

Browser-based map poster generator. Search a city, pick a theme, export SVG or 300 DPI PNG.

**Live demo:** https://mapposter.wing199901.workers.dev

Inspired by [originalankur/maptoposter](https://github.com/originalankur/maptoposter). Renders entirely in the browser and deploys to Cloudflare Workers.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI
- MapLibre GL + OpenFreeMap vector tiles
- Nominatim geocoding (proxied, KV-cached at the edge)
- Vector SVG export, rasterized to PNG at 300 DPI
- Vitest + Playwright

## Features

- 17 ported themes from upstream JSON
- City/country geocoding with manual coordinate override
- Radius control, display labels, Google Fonts family
- Export presets (Instagram, A4, 4K, default poster)
- Shareable URL state + local autosave
- Theme JSON editor
- Live MapLibre preview (pan/zoom, no Generate button)
- Layer toggles (water, roads, buildings, rail, ship routes)
- Optional city boundary mask
- Vector SVG + PNG export; batch all-themes ZIP

## Development

```bash
npm install
npm run dev
```

```bash
npm test          # vitest
npm run test:e2e  # playwright
npm run lint      # oxlint
```

## Build

```bash
npm run build
npm run preview
```

## Cloudflare (Workers)

- Live: https://mapposter.wing199901.workers.dev
- Build: `npm run build`
- Deploy: `npm run deploy`
- Static assets: `dist/` (via `wrangler.toml` `[assets]`)
- API routes: `/api/geocode`, `/api/boundary` (from `functions/`)

### KV setup (edge geocode cache)

1. `npx wrangler kv namespace create PROXY_CACHE`
2. Put the namespace `id` in `wrangler.toml` under `[[kv_namespaces]]`
3. Redeploy

Successful Nominatim responses are cached in KV for 30 days (`X-Cache: HIT|MISS`). Local `npm run dev` uses an in-memory cache in `vite.dev-proxy.ts`.

## Self-hosting (Docker)

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:7200` (override with `APP_PORT`). Set `GEOCODE_CONTACT_EMAIL` for Nominatim policy.

## License

MIT
