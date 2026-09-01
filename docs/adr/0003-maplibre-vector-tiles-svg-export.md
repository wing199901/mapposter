# ADR 0003: MapLibre vector tiles and SVG export

## Status

Accepted (supersedes ADR 0001 rendering approach)

## Context

ADR 0001 chose client-side Canvas 2D rendering fed by Overpass API queries. That pipeline works for small cities but struggles at metro scale (25–50 km radius): Overpass timeouts, large feature payloads, and slow Canvas redraws.

OpenFreeMap serves OpenMapTiles vector tiles directly from the browser. MapLibre GL can style roads, water, and parks from those tiles and export true vector SVG via `queryRenderedFeatures`.

## Decision

Replace the Overpass + Canvas pipeline with:

- **Live preview**: MapLibre GL map in the preview panel (no Generate button)
- **Tiles**: OpenFreeMap vector tiles fetched directly from the browser (`https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf`)
- **Layers**: Roads, water, parks, optional buildings (see ADR 0004 for toggles and boundary mask)
- **Theming**: `PosterTheme` → MapLibre style spec in `themeToMapStyle.ts`
- **Export**: Vector SVG from rendered features; PNG rasterized from SVG at 300 DPI
- **Batch ZIP**: PNG + SVG per built-in theme
- **Geocode**: Unchanged — Nominatim via `/api/geocode` proxy
- **Remove**: `/api/overpass`, OSM IndexedDB cache, Canvas draw pipeline

Attribution on exports: `© OpenStreetMap contributors · OpenMapTiles`

## Consequences

**Positive**

- Large metro areas render reliably without Overpass fan-out
- Live pan/zoom preview; config changes apply immediately
- True vector SVG export (scalable, editable)
- Simpler server surface (geocode proxy only)

**Negative**

- Depends on public OpenFreeMap tile service (rate limits at very large radius)
- Visual parity with upstream maptoposter is approximate (tile schema vs raw OSM)
- MapLibre bundle adds client weight
- E2e tests cannot fully mock tile geometry without network stubs

## Alternatives considered

1. **Hybrid Overpass + tiles** — rejected; dual pipeline complexity
2. **Tile proxy on Cloudflare** — deferred; direct browser fetch for now, noted for future ADR
3. **Raster-only export from map canvas** — rejected; user chose true vector SVG

## Related

- ADR 0001 remains valid for "client-side only, no server rendering" invariant
- ADR 0002 (geocode KV cache) unchanged
- ADR 0004 (layer visibility, buildings, boundary mask)
