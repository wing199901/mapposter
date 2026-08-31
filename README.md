# Map Poster Studio

Browser-based map poster generator inspired by [originalankur/maptoposter](https://github.com/originalankur/maptoposter). Renders entirely client-side and deploys to Cloudflare Pages.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI components
- Overpass API + Nominatim geocoding
- Canvas 2D rendering at 300 DPI

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
- API routes: compiled from `functions/` (`/api/geocode`, `/api/overpass`)
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
- Theme JSON editor + batch all-themes ZIP export

## License

MIT
