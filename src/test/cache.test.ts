import { describe, expect, it } from "vitest"

import { geocodeCacheKey } from "@/features/geocode/cache"
import {
  CACHE_TTL_MS,
  CACHE_TTL_SECONDS,
  edgeGeocodeKvKey,
  geocodeCacheKey as sharedGeocodeCacheKey,
  isCacheStale,
} from "../../shared/proxyCacheKeys"

describe("shared cache keys", () => {
  it("normalizes geocode cache keys", () => {
    expect(sharedGeocodeCacheKey(" Paris ", " France ")).toBe("paris:france")
    expect(sharedGeocodeCacheKey("東京", "Japan")).toBe("東京:japan")
    expect(geocodeCacheKey({ city: " Paris ", country: " France " })).toBe("paris:france")
  })

  it("builds edge kv keys from geocode keys", () => {
    expect(edgeGeocodeKvKey("Paris", "France")).toBe("geocode:paris:france")
  })

  it("aligns ttl constants", () => {
    expect(CACHE_TTL_SECONDS).toBe(CACHE_TTL_MS / 1000)
  })
})

describe("cache ttl", () => {
  it("treats entries within ttl as fresh", () => {
    const fetchedAt = Date.now() - CACHE_TTL_MS + 1000
    expect(isCacheStale(fetchedAt)).toBe(false)
  })

  it("treats entries past ttl as stale", () => {
    const fetchedAt = Date.now() - CACHE_TTL_MS - 1
    expect(isCacheStale(fetchedAt)).toBe(true)
  })
})
