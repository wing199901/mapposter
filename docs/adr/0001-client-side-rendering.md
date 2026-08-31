# ADR 0001: Client-side poster rendering

## Status

Accepted

## Context

The upstream [maptoposter](https://github.com/originalankur/maptoposter) CLI renders posters with Python, matplotlib, and OSMnx. We deploy on Cloudflare Pages, which serves static assets and runs JavaScript/TypeScript at the edge. Python and matplotlib are not available in that runtime.

## Decision

Render posters entirely in the browser:

- Fetch OpenStreetMap features via Overpass API
- Geocode with Nominatim (optionally proxied through a Pages Function)
- Draw layers on Canvas 2D in the browser (preview via Web Worker + OffscreenCanvas when supported; export on the main thread)
- Export PNG at true pixel dimensions (`inches × 300`)

## Consequences

**Positive**

- No backend hosting cost for rendering
- Works on Cloudflare Pages free tier
- Instant preview without round trips

**Negative**

- Must reimplement the Python rendering pipeline in TypeScript
- Large cities can stress Overpass; chunking and caching are required
- Batch export of all themes is CPU-heavy in the browser

## Alternatives considered

1. **External Python API** — faithful to upstream stack but adds hosting cost and latency
2. **Rust/WASM on Workers** — higher performance, heavier build (see [maptoposter-online](https://github.com/jackyrwj/maptoposter-online)); deferred unless Canvas performance is insufficient
