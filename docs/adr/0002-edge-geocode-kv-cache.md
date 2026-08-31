# Edge geocode KV cache

Geocode proxy responses are cached in Cloudflare KV for 30 days so repeat city/country lookups across users can skip Nominatim. Browser IndexedDB geocode cache remains the first layer for returning visitors; KV protects upstream rate limits when the client cache misses. Overpass KV and server-side WASM rendering were considered and deferred: OSM payloads are large and client-side rendering stays the production path per ADR 0001.

## Status

Accepted

## Considered options

1. **Client IndexedDB only** — already implemented; does not help first-time visitors or new devices.
2. **KV geocode cache (chosen)** — small payloads, high hit rate for popular cities, shared across users.
3. **KV Overpass cache** — deferred due to large JSON payloads and existing client OSM cache.
4. **Server WASM render** — deferred indefinitely; poster drawing stays client-side.

## Consequences

- Pages Functions still count as Workers invocations; KV reduces Nominatim load, not CF request billing.
- Deploy requires a `PROXY_CACHE` KV namespace binding in `wrangler.toml`.
- Phase 4 WASM server rendering remains out of scope.
