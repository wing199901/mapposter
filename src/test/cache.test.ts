import { describe, expect, it } from "vitest"

import {
  CACHE_TTL_MS,
  geocodeCacheKey,
  isCacheStale,
  osmCacheKey,
} from "@/features/osm/cache"

describe("cache keys", () => {
  it("normalizes geocode cache keys", () => {
    expect(geocodeCacheKey({ city: " Paris ", country: " France " })).toBe("paris:france")
    expect(geocodeCacheKey({ city: "東京", country: "Japan" })).toBe("東京:japan")
  })

  it("rounds osm cache keys to five decimal places", () => {
    expect(osmCacheKey(48.85661, 2.35221, 10000)).toBe("48.85661:2.35221:10000")
    expect(osmCacheKey(48.856619, 2.352219, 10500)).toBe("48.85662:2.35222:10500")
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
