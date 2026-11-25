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

- Cold-start bilingual Hong Kong demo (regional Noto Sans HK); Latin letter-spacing for Western places
- OSM namedetails → local + Latin name pairs when the place has a CJK local name
- 17 ported themes from upstream JSON
- City/country geocoding with manual coordinate override
- Radius control, display labels, Google Fonts + regional Noto families
- Export presets (Instagram, A4, 4K, default poster)
- Shareable URL state + local autosave
- Theme JSON editor
- Live MapLibre preview (pan/zoom, no Generate button)
- Map-first shell: poster preview dominates; Location & Style open from a Menu Sheet
- Layer toggles (water, roads, buildings, rail, ship routes)
- Optional city boundary mask
- Vector SVG + PNG export; batch all-themes ZIP

## Try these

Bilingual share links (`#p=` hashes from `encodePosterState`, `centerLocked` so the framed poster stays stable on open). Source configs: `src/features/editor/shareDemoConfigs.ts`.

- **Hong Kong** (香港 · Noto Sans HK · noir) — https://mapposter.wing199901.workers.dev/#p=eyJnZW9jb2RlQ2l0eSI6IkhvbmcgS29uZyIsImdlb2NvZGVDb3VudHJ5IjoiSG9uZyBLb25nIiwibGF0aXR1ZGUiOjIyLjMxOTMsImxvbmdpdHVkZSI6MTE0LjE2OTQsInJhZGl1c01ldGVycyI6MzAwMDAsInRoZW1lSWQiOiJub2lyIiwiZGlzcGxheUNpdHkiOiLpppnmuK8iLCJkaXNwbGF5Q291bnRyeSI6Iummmea4ryIsImRpc3BsYXlDaXR5TGF0aW4iOiJIb25nIEtvbmciLCJkaXNwbGF5Q291bnRyeUxhdGluIjoiSG9uZyBLb25nIiwiZGlzcGxheVNjcmlwdEZhbWlseSI6ImhrIiwiZGlzcGxheUhhc1BsYWNlTG9jYWxOYW1lIjp0cnVlLCJmb250RmFtaWx5IjoiTm90byBTYW5zIEhLIiwiY2VudGVyTG9ja2VkIjp0cnVlLCJ3aWR0aEluY2hlcyI6MTIsImhlaWdodEluY2hlcyI6MTYsImxheWVyVmlzaWJpbGl0eSI6eyJ3YXRlciI6dHJ1ZSwid2F0ZXJ3YXkiOnRydWUsInBhcmtzIjp0cnVlLCJidWlsZGluZ3MiOmZhbHNlLCJyb2FkTW90b3J3YXkiOnRydWUsInJvYWRQcmltYXJ5Ijp0cnVlLCJyb2FkU2Vjb25kYXJ5Ijp0cnVlLCJyb2FkVGVydGlhcnkiOnRydWUsInJvYWRSZXNpZGVudGlhbCI6dHJ1ZSwicm9hZERlZmF1bHQiOnRydWUsInJhaWwiOnRydWUsInNoaXBSb3V0ZXMiOnRydWV9LCJib3VuZGFyeU1hc2tFbmFibGVkIjpmYWxzZX0=
- **Kyoto** (京都 · Noto Sans JP · japanese_ink) — https://mapposter.wing199901.workers.dev/#p=eyJnZW9jb2RlQ2l0eSI6Ikt5b3RvIiwiZ2VvY29kZUNvdW50cnkiOiJKYXBhbiIsImxhdGl0dWRlIjozNS4wMTE2LCJsb25naXR1ZGUiOjEzNS43NjgxLCJyYWRpdXNNZXRlcnMiOjEyMDAwLCJ0aGVtZUlkIjoiamFwYW5lc2VfaW5rIiwiZGlzcGxheUNpdHkiOiLkuqzpg70iLCJkaXNwbGF5Q291bnRyeSI6IuaXpeacrCIsImRpc3BsYXlDaXR5TGF0aW4iOiJLeW90byIsImRpc3BsYXlDb3VudHJ5TGF0aW4iOiJKYXBhbiIsImRpc3BsYXlTY3JpcHRGYW1pbHkiOiJqcCIsImRpc3BsYXlIYXNQbGFjZUxvY2FsTmFtZSI6dHJ1ZSwiZm9udEZhbWlseSI6Ik5vdG8gU2FucyBKUCIsImNlbnRlckxvY2tlZCI6dHJ1ZSwid2lkdGhJbmNoZXMiOjEyLCJoZWlnaHRJbmNoZXMiOjE2LCJsYXllclZpc2liaWxpdHkiOnsid2F0ZXIiOnRydWUsIndhdGVyd2F5Ijp0cnVlLCJwYXJrcyI6dHJ1ZSwiYnVpbGRpbmdzIjpmYWxzZSwicm9hZE1vdG9yd2F5Ijp0cnVlLCJyb2FkUHJpbWFyeSI6dHJ1ZSwicm9hZFNlY29uZGFyeSI6dHJ1ZSwicm9hZFRlcnRpYXJ5Ijp0cnVlLCJyb2FkUmVzaWRlbnRpYWwiOnRydWUsInJvYWREZWZhdWx0Ijp0cnVlLCJyYWlsIjp0cnVlLCJzaGlwUm91dGVzIjp0cnVlfSwiYm91bmRhcnlNYXNrRW5hYmxlZCI6ZmFsc2V9
- **Taipei** (臺北 · Noto Sans TC · blueprint) — https://mapposter.wing199901.workers.dev/#p=eyJnZW9jb2RlQ2l0eSI6IlRhaXBlaSIsImdlb2NvZGVDb3VudHJ5IjoiVGFpd2FuIiwibGF0aXR1ZGUiOjI1LjAzMywibG9uZ2l0dWRlIjoxMjEuNTY1NCwicmFkaXVzTWV0ZXJzIjoxMjAwMCwidGhlbWVJZCI6ImJsdWVwcmludCIsImRpc3BsYXlDaXR5Ijoi6Ie65YyXIiwiZGlzcGxheUNvdW50cnkiOiLlj7DngaMiLCJkaXNwbGF5Q2l0eUxhdGluIjoiVGFpcGVpIiwiZGlzcGxheUNvdW50cnlMYXRpbiI6IlRhaXdhbiIsImRpc3BsYXlTY3JpcHRGYW1pbHkiOiJ0YyIsImRpc3BsYXlIYXNQbGFjZUxvY2FsTmFtZSI6dHJ1ZSwiZm9udEZhbWlseSI6Ik5vdG8gU2FucyBUQyIsImNlbnRlckxvY2tlZCI6dHJ1ZSwid2lkdGhJbmNoZXMiOjEyLCJoZWlnaHRJbmNoZXMiOjE2LCJsYXllclZpc2liaWxpdHkiOnsid2F0ZXIiOnRydWUsIndhdGVyd2F5Ijp0cnVlLCJwYXJrcyI6dHJ1ZSwiYnVpbGRpbmdzIjpmYWxzZSwicm9hZE1vdG9yd2F5Ijp0cnVlLCJyb2FkUHJpbWFyeSI6dHJ1ZSwicm9hZFNlY29uZGFyeSI6dHJ1ZSwicm9hZFRlcnRpYXJ5Ijp0cnVlLCJyb2FkUmVzaWRlbnRpYWwiOnRydWUsInJvYWREZWZhdWx0Ijp0cnVlLCJyYWlsIjp0cnVlLCJzaGlwUm91dGVzIjp0cnVlfSwiYm91bmRhcnlNYXNrRW5hYmxlZCI6ZmFsc2V9
- **Seoul** (서울 · Noto Sans KR · midnight_blue) — https://mapposter.wing199901.workers.dev/#p=eyJnZW9jb2RlQ2l0eSI6IlNlb3VsIiwiZ2VvY29kZUNvdW50cnkiOiJTb3V0aCBLb3JlYSIsImxhdGl0dWRlIjozNy41NjY1LCJsb25naXR1ZGUiOjEyNi45NzgsInJhZGl1c01ldGVycyI6MTQwMDAsInRoZW1lSWQiOiJtaWRuaWdodF9ibHVlIiwiZGlzcGxheUNpdHkiOiLshJzsmrgiLCJkaXNwbGF5Q291bnRyeSI6IuuMgO2VnOuvvOq1rSIsImRpc3BsYXlDaXR5TGF0aW4iOiJTZW91bCIsImRpc3BsYXlDb3VudHJ5TGF0aW4iOiJTb3V0aCBLb3JlYSIsImRpc3BsYXlTY3JpcHRGYW1pbHkiOiJrciIsImRpc3BsYXlIYXNQbGFjZUxvY2FsTmFtZSI6dHJ1ZSwiZm9udEZhbWlseSI6Ik5vdG8gU2FucyBLUiIsImNlbnRlckxvY2tlZCI6dHJ1ZSwid2lkdGhJbmNoZXMiOjEyLCJoZWlnaHRJbmNoZXMiOjE2LCJsYXllclZpc2liaWxpdHkiOnsid2F0ZXIiOnRydWUsIndhdGVyd2F5Ijp0cnVlLCJwYXJrcyI6dHJ1ZSwiYnVpbGRpbmdzIjpmYWxzZSwicm9hZE1vdG9yd2F5Ijp0cnVlLCJyb2FkUHJpbWFyeSI6dHJ1ZSwicm9hZFNlY29uZGFyeSI6dHJ1ZSwicm9hZFRlcnRpYXJ5Ijp0cnVlLCJyb2FkUmVzaWRlbnRpYWwiOnRydWUsInJvYWREZWZhdWx0Ijp0cnVlLCJyYWlsIjp0cnVlLCJzaGlwUm91dGVzIjp0cnVlfSwiYm91bmRhcnlNYXNrRW5hYmxlZCI6ZmFsc2V9
- **Tokyo** (東京 · Noto Sans JP · japanese_ink) — https://mapposter.wing199901.workers.dev/#p=eyJnZW9jb2RlQ2l0eSI6IlRva3lvIiwiZ2VvY29kZUNvdW50cnkiOiJKYXBhbiIsImxhdGl0dWRlIjozNS42NzYyLCJsb25naXR1ZGUiOjEzOS42NTAzLCJyYWRpdXNNZXRlcnMiOjE4MDAwLCJ0aGVtZUlkIjoiamFwYW5lc2VfaW5rIiwiZGlzcGxheUNpdHkiOiLmnbHkuqwiLCJkaXNwbGF5Q291bnRyeSI6IuaXpeacrCIsImRpc3BsYXlDaXR5TGF0aW4iOiJUb2t5byIsImRpc3BsYXlDb3VudHJ5TGF0aW4iOiJKYXBhbiIsImRpc3BsYXlTY3JpcHRGYW1pbHkiOiJqcCIsImRpc3BsYXlIYXNQbGFjZUxvY2FsTmFtZSI6dHJ1ZSwiZm9udEZhbWlseSI6Ik5vdG8gU2FucyBKUCIsImNlbnRlckxvY2tlZCI6dHJ1ZSwid2lkdGhJbmNoZXMiOjEyLCJoZWlnaHRJbmNoZXMiOjE2LCJsYXllclZpc2liaWxpdHkiOnsid2F0ZXIiOnRydWUsIndhdGVyd2F5Ijp0cnVlLCJwYXJrcyI6dHJ1ZSwiYnVpbGRpbmdzIjpmYWxzZSwicm9hZE1vdG9yd2F5Ijp0cnVlLCJyb2FkUHJpbWFyeSI6dHJ1ZSwicm9hZFNlY29uZGFyeSI6dHJ1ZSwicm9hZFRlcnRpYXJ5Ijp0cnVlLCJyb2FkUmVzaWRlbnRpYWwiOnRydWUsInJvYWREZWZhdWx0Ijp0cnVlLCJyYWlsIjp0cnVlLCJzaGlwUm91dGVzIjp0cnVlfSwiYm91bmRhcnlNYXNrRW5hYmxlZCI6ZmFsc2V9

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
