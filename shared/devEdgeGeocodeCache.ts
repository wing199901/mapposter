import {
  CACHE_TTL_MS,
  edgeGeocodeKvKey,
  isCacheStale,
} from "./proxyCacheKeys.js"

export interface DevGeocodeCacheEntry {
  latitude: number
  longitude: number
  displayName: string
  suggestedRadiusMeters?: number
  fetchedAt: number
}

const devGeocodeCache = new Map<string, DevGeocodeCacheEntry>()

export function readDevEdgeGeocode(city: string, country: string): DevGeocodeCacheEntry | null {
  const cached = devGeocodeCache.get(edgeGeocodeKvKey(city, country))
  if (!cached || isCacheStale(cached.fetchedAt)) {
    if (cached) {
      devGeocodeCache.delete(edgeGeocodeKvKey(city, country))
    }
    return null
  }
  return cached
}

export function writeDevEdgeGeocode(
  city: string,
  country: string,
  result: Omit<DevGeocodeCacheEntry, "fetchedAt">,
): void {
  devGeocodeCache.set(edgeGeocodeKvKey(city, country), {
    ...result,
    fetchedAt: Date.now(),
  })
}

export function clearDevEdgeGeocodeCache(): void {
  devGeocodeCache.clear()
}

export function getDevEdgeGeocodeCacheTtlMs(): number {
  return CACHE_TTL_MS
}
