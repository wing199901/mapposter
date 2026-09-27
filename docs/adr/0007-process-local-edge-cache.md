# Process-local edge cache off Cloudflare

Geocode and place-boundary proxies share one handler. Cloudflare Pages caches successful lookups in KV (ADR 0002). Vite dev and the Docker self-host have no KV, so they use one process-local cache with the same expiry. All three resolve a Place boundary through the same mask lookup. A Node process cannot hold the cross-user KV cache; restarting it drops the process-local copy.

## Status

Accepted

## Considered options

1. **Shared handler, KV on Pages, process-local cache on Vite and Docker (chosen).** Response shape and Place boundary resolution stay aligned. Nominatim is skipped on repeat lookups inside one process.
2. **Align the response only.** Docker would call Nominatim on every lookup.
3. **Leave the Docker server on its own fetch path.** That path already skips both the cache and the shared Place boundary lookup.
