import {
  boundaryCacheKey,
  CACHE_TTL_MS,
  edgeGeocodeKvKey,
  isCacheStale,
} from "./proxyCacheKeys.js"

export interface DevGeocodeCacheEntry {
  latitude: number
  longitude: number
  displayName: string
  suggestedRadiusMeters?: number
  osmType?: "node" | "way" | "relation"
  osmId?: number
  fetchedAt: number
}

import type { MultiPolygon, Polygon } from "geojson"

export interface DevBoundaryCacheEntry {
  geometry: Polygon | MultiPolygon
  fetchedAt: number
}

const devGeocodeCache = new Map<string, DevGeocodeCacheEntry>()
const devBoundaryCache = new Map<string, DevBoundaryCacheEntry>()

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

export function readDevEdgeBoundary(
  osmType: string,
  osmId: number,
  radiusMeters?: number,
): DevBoundaryCacheEntry | null {
  const key = boundaryCacheKey(osmType, osmId, radiusMeters)
  const cached = devBoundaryCache.get(key)
  if (!cached || isCacheStale(cached.fetchedAt)) {
    if (cached) {
      devBoundaryCache.delete(key)
    }
    return null
  }
  return cached
}

export function writeDevEdgeBoundary(
  osmType: string,
  osmId: number,
  geometry: Polygon | MultiPolygon,
  radiusMeters?: number,
): void {
  devBoundaryCache.set(boundaryCacheKey(osmType, osmId, radiusMeters), {
    geometry,
    fetchedAt: Date.now(),
  })
}

export function clearDevEdgeGeocodeCache(): void {
  devGeocodeCache.clear()
}

export function clearDevEdgeBoundaryCache(): void {
  devBoundaryCache.clear()
}

export function getDevEdgeGeocodeCacheTtlMs(): number {
  return CACHE_TTL_MS
}
