/// <reference path="../env.d.ts" />

import {
  CACHE_TTL_SECONDS,
  edgeBoundaryKvKey,
  edgeGeocodeKvKey,
  isCacheStale,
} from "../../shared/proxyCacheKeys"

export interface EdgeGeocodeResult {
  latitude: number
  longitude: number
  displayName: string
  suggestedRadiusMeters?: number
  osmType?: "node" | "way" | "relation"
  osmId?: number
  fetchedAt: number
}

export interface EdgeBoundaryResult {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  fetchedAt: number
}

export interface EdgeCacheEnv {
  PROXY_CACHE?: KVNamespace
}

export async function readEdgeGeocode(
  env: EdgeCacheEnv,
  city: string,
  country: string,
): Promise<EdgeGeocodeResult | null> {
  if (!env.PROXY_CACHE) {
    return null
  }

  const cached = await env.PROXY_CACHE.get(edgeGeocodeKvKey(city, country))
  if (!cached) {
    return null
  }

  try {
    const parsed = JSON.parse(cached) as EdgeGeocodeResult
    if (isCacheStale(parsed.fetchedAt)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function writeEdgeGeocode(
  env: EdgeCacheEnv,
  city: string,
  country: string,
  result: Omit<EdgeGeocodeResult, "fetchedAt">,
): Promise<void> {
  if (!env.PROXY_CACHE) {
    return
  }

  const payload: EdgeGeocodeResult = {
    ...result,
    fetchedAt: Date.now(),
  }

  await env.PROXY_CACHE.put(edgeGeocodeKvKey(city, country), JSON.stringify(payload), {
    expirationTtl: CACHE_TTL_SECONDS,
  })
}

export async function readEdgeBoundary(
  env: EdgeCacheEnv,
  osmType: string,
  osmId: number,
  radiusMeters?: number,
): Promise<EdgeBoundaryResult | null> {
  if (!env.PROXY_CACHE) {
    return null
  }

  const cached = await env.PROXY_CACHE.get(edgeBoundaryKvKey(osmType, osmId, radiusMeters))
  if (!cached) {
    return null
  }

  try {
    const parsed = JSON.parse(cached) as EdgeBoundaryResult
    if (isCacheStale(parsed.fetchedAt)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function writeEdgeBoundary(
  env: EdgeCacheEnv,
  osmType: string,
  osmId: number,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  radiusMeters?: number,
): Promise<void> {
  if (!env.PROXY_CACHE) {
    return
  }

  const payload: EdgeBoundaryResult = {
    geometry,
    fetchedAt: Date.now(),
  }

  await env.PROXY_CACHE.put(
    edgeBoundaryKvKey(osmType, osmId, radiusMeters),
    JSON.stringify(payload),
    {
      expirationTtl: CACHE_TTL_SECONDS,
    },
  )
}
