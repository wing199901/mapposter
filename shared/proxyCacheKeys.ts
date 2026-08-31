export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60

export function geocodeCacheKey(city: string, country: string): string {
  return `${city.trim().toLowerCase()}:${country.trim().toLowerCase()}`
}

export function edgeGeocodeKvKey(city: string, country: string): string {
  return `geocode:${geocodeCacheKey(city, country)}`
}

export function isCacheStale(fetchedAt: number, ttlMs = CACHE_TTL_MS): boolean {
  return Date.now() - fetchedAt > ttlMs
}
