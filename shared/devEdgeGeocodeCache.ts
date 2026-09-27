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
  placeLocalName?: string
  placeLatinName?: string
  countryLocalName?: string
  countryLatinName?: string
  countryCode?: string
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

function geocodeBodyFromCache(entry: DevGeocodeCacheEntry) {
  return {
    latitude: entry.latitude,
    longitude: entry.longitude,
    displayName: entry.displayName,
    placeLocalName: entry.placeLocalName,
    placeLatinName: entry.placeLatinName,
    countryLocalName: entry.countryLocalName,
    countryLatinName: entry.countryLatinName,
    countryCode: entry.countryCode,
    suggestedRadiusMeters: entry.suggestedRadiusMeters,
    osmType: entry.osmType,
    osmId: entry.osmId,
  }
}

/** Process-local edge cache shared by the Vite dev server and the Docker self-host. */
export const processEdgeCache = {
  async readGeocode(city: string, country: string) {
    const cached = readDevEdgeGeocode(city, country)
    return cached ? geocodeBodyFromCache(cached) : null
  },
  async writeGeocode(
    city: string,
    country: string,
    result: Omit<DevGeocodeCacheEntry, "fetchedAt">,
  ) {
    writeDevEdgeGeocode(city, country, result)
  },
  async readBoundary(osmType: string, osmId: number, radiusMeters?: number) {
    return readDevEdgeBoundary(osmType, osmId, radiusMeters)?.geometry ?? null
  },
  async writeBoundary(
    osmType: string,
    osmId: number,
    geometry: DevBoundaryCacheEntry["geometry"],
    radiusMeters?: number,
  ) {
    writeDevEdgeBoundary(osmType, osmId, geometry, radiusMeters)
  },
}
